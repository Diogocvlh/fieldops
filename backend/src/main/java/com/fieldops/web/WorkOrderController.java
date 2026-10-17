package com.fieldops.web;

import com.fieldops.service.WorkOrderService;
import com.fieldops.web.dto.AssignmentInput;
import com.fieldops.web.dto.WorkOrderInput;
import com.fieldops.web.dto.WorkOrderView;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/work-orders")
public class WorkOrderController {
    private final WorkOrderService orders;

    public WorkOrderController(WorkOrderService orders) { this.orders = orders; }

    @GetMapping
    public List<WorkOrderView> list() { return orders.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkOrderView create(@Valid @RequestBody WorkOrderInput input) { return orders.create(input); }

    @PutMapping("/{id}")
    public WorkOrderView update(@PathVariable UUID id, @Valid @RequestBody WorkOrderInput input) {
        return orders.update(id, input);
    }

    @PostMapping("/{id}/assign")
    public WorkOrderView assign(@PathVariable UUID id, @Valid @RequestBody AssignmentInput input) {
        return orders.assign(id, input.technicianId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { orders.delete(id); }
}
