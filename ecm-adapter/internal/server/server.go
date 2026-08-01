// Package server exposes the process-facing HTTP API of the adapter.
package server

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"ecm-adapter/internal/ecm"
	"ecm-adapter/internal/model"
)

type Server struct {
	ecm *ecm.Client
	log *slog.Logger
}

func New(client *ecm.Client, logger *slog.Logger) *Server {
	return &Server{ecm: client, log: logger}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /adapter/v1/documents", s.list)
	mux.HandleFunc("POST /adapter/v1/documents", s.upload)
	mux.HandleFunc("GET /adapter/v1/documents/{id}", s.get)
	mux.HandleFunc("GET /adapter/v1/documents/{id}/content", s.content)
	mux.HandleFunc("PUT /adapter/v1/documents/{id}/state", s.changeState)
	return mux
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) list(w http.ResponseWriter, r *http.Request) {
	status := ""
	if state := r.URL.Query().Get("state"); state != "" {
		var err error
		if status, err = model.StateToStatus(state); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
	}
	docs, err := s.ecm.List(r.URL.Query().Get("case_id"), status)
	if err != nil {
		s.upstreamError(w, err)
		return
	}
	out := make([]model.ProcessDocument, 0, len(docs))
	for _, d := range docs {
		out = append(out, model.ToProcess(d))
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) get(w http.ResponseWriter, r *http.Request) {
	doc, err := s.ecm.Get(r.PathValue("id"))
	if err != nil {
		s.upstreamError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, model.ToProcess(doc))
}

func (s *Server) content(w http.ResponseWriter, r *http.Request) {
	body, contentType, err := s.ecm.GetContent(r.PathValue("id"))
	if err != nil {
		s.upstreamError(w, err)
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

func (s *Server) upload(w http.ResponseWriter, r *http.Request) {
	var req model.UploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	docType, err := model.CategoryToType(req.Category)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	content, err := base64.StdEncoding.DecodeString(req.ContentBase64)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("content_base64 is not valid base64"))
		return
	}
	mimeType := req.MediaType
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	doc, err := s.ecm.Upload(req.Name, docType, mimeType, content, req.Owner, req.CaseID)
	if err != nil {
		s.upstreamError(w, err)
		return
	}
	s.log.Info("document stored via adapter",
		"id", doc.ID, "category", req.Category, "ecmType", docType, "size", doc.SizeBytes)
	writeJSON(w, http.StatusCreated, model.ToProcess(doc))
}

func (s *Server) changeState(w http.ResponseWriter, r *http.Request) {
	var req struct {
		State string `json:"state"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	status, err := model.StateToStatus(req.State)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	doc, err := s.ecm.ChangeStatus(r.PathValue("id"), status)
	if err != nil {
		s.upstreamError(w, err)
		return
	}
	s.log.Info("document state changed via adapter",
		"id", doc.ID, "state", req.State, "ecmStatus", status)
	writeJSON(w, http.StatusOK, model.ToProcess(doc))
}

// upstreamError passes ECM 4xx statuses through and hides the rest as 502.
func (s *Server) upstreamError(w http.ResponseWriter, err error) {
	var apiErr *ecm.APIError
	if errors.As(err, &apiErr) && apiErr.StatusCode >= 400 && apiErr.StatusCode < 500 {
		writeJSON(w, apiErr.StatusCode, map[string]string{"error": apiErr.Body})
		return
	}
	s.log.Error("ecm call failed", "error", err)
	writeError(w, http.StatusBadGateway, errors.New("ecm unavailable"))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}
