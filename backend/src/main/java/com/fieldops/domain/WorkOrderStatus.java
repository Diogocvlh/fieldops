package com.fieldops.domain;

public enum WorkOrderStatus {
    OPEN("Aberta"),
    ASSIGNED("Atribuída"),
    IN_PROGRESS("Em andamento"),
    COMPLETED("Concluída"),
    CANCELLED("Cancelada");

    private final String label;

    WorkOrderStatus(String label) {
        this.label = label;
    }

    public String label() { return label; }
    public boolean isActive() { return this == ASSIGNED || this == IN_PROGRESS; }
    public boolean isTerminal() { return this == COMPLETED || this == CANCELLED; }
}
