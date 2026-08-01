package org.operaton.examples.loanapplication.ecm;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/ecm/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto> upload(@RequestParam("file") MultipartFile file,
                                              @RequestParam("type") DocumentType type,
                                              @RequestParam(value = "uploadedBy", required = false) String uploadedBy,
                                              @RequestParam(value = "processInstanceId", required = false) String processInstanceId)
            throws IOException {
        Document document = documentService.upload(
                file.getOriginalFilename(),
                type,
                file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE,
                file.getBytes(),
                uploadedBy,
                processInstanceId);
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentDto.from(document));
    }

    @GetMapping
    public List<DocumentDto> list(@RequestParam(value = "processInstanceId", required = false) String processInstanceId,
                                  @RequestParam(value = "status", required = false) DocumentStatus status) {
        return documentService.list(processInstanceId, status).stream()
                .map(DocumentDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    public DocumentDto get(@PathVariable UUID id) {
        return DocumentDto.from(documentService.get(id));
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<byte[]> content(@PathVariable UUID id) {
        Document document = documentService.get(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(document.getMimeType()))
                .body(document.getContent());
    }

    @PatchMapping("/{id}/status")
    public DocumentDto changeStatus(@PathVariable UUID id, @RequestParam("value") DocumentStatus value) {
        return DocumentDto.from(documentService.changeStatus(id, value));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
