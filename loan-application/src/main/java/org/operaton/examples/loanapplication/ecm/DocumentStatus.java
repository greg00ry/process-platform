package org.operaton.examples.loanapplication.ecm;

import java.util.Map;
import java.util.Set;

public enum DocumentStatus {
    UPLOADED,
    VERIFIED,
    APPROVED,
    REJECTED,
    ARCHIVED;

    private static final Map<DocumentStatus, Set<DocumentStatus>> ALLOWED_TRANSITIONS = Map.of(
            UPLOADED, Set.of(VERIFIED, REJECTED, ARCHIVED),
            VERIFIED, Set.of(APPROVED, REJECTED, ARCHIVED),
            APPROVED, Set.of(ARCHIVED),
            REJECTED, Set.of(ARCHIVED),
            ARCHIVED, Set.of()
    );

    public boolean canTransitionTo(DocumentStatus target) {
        return ALLOWED_TRANSITIONS.get(this).contains(target);
    }
}
