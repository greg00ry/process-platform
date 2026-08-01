// Package ecm is the HTTP client for the Java ECM simulation API.
package ecm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"time"

	"ecm-adapter/internal/model"
)

// APIError carries the upstream HTTP status so handlers can pass it through.
type APIError struct {
	StatusCode int
	Body       string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("ecm returned %d: %s", e.StatusCode, e.Body)
}

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) List(processInstanceID, status string) ([]model.EcmDocument, error) {
	q := url.Values{}
	if processInstanceID != "" {
		q.Set("processInstanceId", processInstanceID)
	}
	if status != "" {
		q.Set("status", status)
	}
	endpoint := c.baseURL + "/api/ecm/documents"
	if len(q) > 0 {
		endpoint += "?" + q.Encode()
	}
	var docs []model.EcmDocument
	if err := c.getJSON(endpoint, &docs); err != nil {
		return nil, err
	}
	return docs, nil
}

func (c *Client) Get(id string) (model.EcmDocument, error) {
	var doc model.EcmDocument
	err := c.getJSON(c.baseURL+"/api/ecm/documents/"+url.PathEscape(id), &doc)
	return doc, err
}

func (c *Client) GetContent(id string) ([]byte, string, error) {
	resp, err := c.http.Get(c.baseURL + "/api/ecm/documents/" + url.PathEscape(id) + "/content")
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, "", &APIError{StatusCode: resp.StatusCode, Body: string(body)}
	}
	return body, resp.Header.Get("Content-Type"), nil
}

func (c *Client) Upload(fileName, docType, mimeType string, content []byte, uploadedBy, processInstanceID string) (model.EcmDocument, error) {
	var doc model.EcmDocument

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	h := textproto.MIMEHeader{}
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename=%q`, fileName))
	h.Set("Content-Type", mimeType)
	part, err := w.CreatePart(h)
	if err != nil {
		return doc, err
	}
	if _, err := part.Write(content); err != nil {
		return doc, err
	}
	fields := map[string]string{"type": docType}
	if uploadedBy != "" {
		fields["uploadedBy"] = uploadedBy
	}
	if processInstanceID != "" {
		fields["processInstanceId"] = processInstanceID
	}
	for k, v := range fields {
		if err := w.WriteField(k, v); err != nil {
			return doc, err
		}
	}
	if err := w.Close(); err != nil {
		return doc, err
	}

	resp, err := c.http.Post(c.baseURL+"/api/ecm/documents", w.FormDataContentType(), &buf)
	if err != nil {
		return doc, err
	}
	return doc, decodeJSON(resp, http.StatusCreated, &doc)
}

func (c *Client) ChangeStatus(id, status string) (model.EcmDocument, error) {
	var doc model.EcmDocument
	endpoint := c.baseURL + "/api/ecm/documents/" + url.PathEscape(id) + "/status?value=" + url.QueryEscape(status)
	req, err := http.NewRequest(http.MethodPatch, endpoint, nil)
	if err != nil {
		return doc, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return doc, err
	}
	return doc, decodeJSON(resp, http.StatusOK, &doc)
}

func (c *Client) getJSON(endpoint string, out any) error {
	resp, err := c.http.Get(endpoint)
	if err != nil {
		return err
	}
	return decodeJSON(resp, http.StatusOK, out)
}

func decodeJSON(resp *http.Response, wantStatus int, out any) error {
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode != wantStatus {
		return &APIError{StatusCode: resp.StatusCode, Body: string(body)}
	}
	return json.Unmarshal(body, out)
}
