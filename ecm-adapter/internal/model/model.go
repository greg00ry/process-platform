// Package model defines both document representations and the mapping
// between them: the ECM format (as served by the Java /api/ecm API) and
// the process format (what the BPMN process side consumes).
package model

import (
	"fmt"
	"time"
)

// EcmDocument mirrors DocumentDto from the Java ECM API.
type EcmDocument struct {
	ID                string    `json:"id"`
	FileName          string    `json:"fileName"`
	Type              string    `json:"type"`
	Status            string    `json:"status"`
	MimeType          string    `json:"mimeType"`
	SizeBytes         int64     `json:"sizeBytes"`
	UploadedBy        string    `json:"uploadedBy"`
	ProcessInstanceID string    `json:"processInstanceId"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// ProcessDocument is the process-side representation: snake_case fields,
// its own state/category vocabulary and "case" terminology.
type ProcessDocument struct {
	DocumentID string    `json:"document_id"`
	Name       string    `json:"name"`
	Category   string    `json:"category"`
	State      string    `json:"state"`
	MediaType  string    `json:"media_type"`
	Size       int64     `json:"size"`
	Owner      string    `json:"owner,omitempty"`
	CaseID     string    `json:"case_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	ModifiedAt time.Time `json:"modified_at"`
}

// UploadRequest is what the process side sends to store a document.
type UploadRequest struct {
	Name          string `json:"name"`
	Category      string `json:"category"`
	MediaType     string `json:"media_type"`
	Owner         string `json:"owner"`
	CaseID        string `json:"case_id"`
	ContentBase64 string `json:"content_base64"`
}

var statusToState = map[string]string{
	"UPLOADED": "RECEIVED",
	"VERIFIED": "VALIDATED",
	"APPROVED": "ACCEPTED",
	"REJECTED": "DECLINED",
	"ARCHIVED": "CLOSED",
}

var typeToCategory = map[string]string{
	"APPLICATION_FORM": "loan-form",
	"INCOME_STATEMENT": "income-proof",
	"ID_SCAN":          "identity",
	"CREDIT_REPORT":    "credit-report",
	"LOAN_CONTRACT":    "contract",
	"OTHER":            "other",
}

var stateToStatus = invert(statusToState)
var categoryToType = invert(typeToCategory)

func invert(m map[string]string) map[string]string {
	out := make(map[string]string, len(m))
	for k, v := range m {
		out[v] = k
	}
	return out
}

// StateToStatus translates a process state into an ECM status.
func StateToStatus(state string) (string, error) {
	status, ok := stateToStatus[state]
	if !ok {
		return "", fmt.Errorf("unknown process state %q", state)
	}
	return status, nil
}

// CategoryToType translates a process category into an ECM document type.
func CategoryToType(category string) (string, error) {
	t, ok := categoryToType[category]
	if !ok {
		return "", fmt.Errorf("unknown process category %q", category)
	}
	return t, nil
}

// ToProcess maps an ECM document to the process representation.
func ToProcess(d EcmDocument) ProcessDocument {
	state, ok := statusToState[d.Status]
	if !ok {
		state = "UNKNOWN"
	}
	category, ok := typeToCategory[d.Type]
	if !ok {
		category = "other"
	}
	return ProcessDocument{
		DocumentID: d.ID,
		Name:       d.FileName,
		Category:   category,
		State:      state,
		MediaType:  d.MimeType,
		Size:       d.SizeBytes,
		Owner:      d.UploadedBy,
		CaseID:     d.ProcessInstanceID,
		CreatedAt:  d.CreatedAt,
		ModifiedAt: d.UpdatedAt,
	}
}
