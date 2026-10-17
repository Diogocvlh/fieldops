CREATE SEQUENCE work_order_number START WITH 1 INCREMENT BY 1;

CREATE TABLE technicians (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    registration VARCHAR(64) NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    region VARCHAR(120) NOT NULL,
    available BOOLEAN NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 20),
    CONSTRAINT uq_technician_registration UNIQUE (registration),
    CONSTRAINT ck_registration_normalized CHECK (registration = UPPER(TRIM(registration)))
);

CREATE TABLE work_orders (
    id UUID PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    technician_id UUID,
    priority VARCHAR(16) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_work_order_code UNIQUE (code),
    CONSTRAINT fk_work_order_technician FOREIGN KEY (technician_id) REFERENCES technicians(id),
    CONSTRAINT ck_work_order_assignment CHECK (
        (status = 'OPEN' AND technician_id IS NULL) OR
        (status IN ('ASSIGNED', 'IN_PROGRESS') AND technician_id IS NOT NULL) OR
        status IN ('COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT ck_work_order_completion CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL) OR
        (status <> 'COMPLETED' AND completed_at IS NULL)
    )
);

CREATE INDEX idx_work_orders_technician_status ON work_orders(technician_id, status);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX idx_work_orders_completed_at ON work_orders(completed_at);

CREATE TABLE activities (
    id UUID PRIMARY KEY,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    work_order_id UUID,
    CONSTRAINT fk_activity_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_activities_created_at ON activities(created_at);
