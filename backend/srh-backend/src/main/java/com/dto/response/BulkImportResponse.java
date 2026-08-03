package com.dto.response;

import java.util.List;

public class BulkImportResponse {

    private int importedCount;
    private int skippedCount;
    private List<String> errors;

    public BulkImportResponse(int importedCount, int skippedCount, List<String> errors) {
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.errors = errors;
    }

    public int getImportedCount() { return importedCount; }

    public int getSkippedCount() { return skippedCount; }

    public List<String> getErrors() { return errors; }
}
