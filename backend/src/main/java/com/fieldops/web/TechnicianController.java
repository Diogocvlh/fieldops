package com.fieldops.web;

import com.fieldops.service.TechnicianService;
import com.fieldops.web.dto.TechnicianInput;
import com.fieldops.web.dto.TechnicianView;
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
@RequestMapping("/api/v1/technicians")
public class TechnicianController {
    private final TechnicianService technicians;

    public TechnicianController(TechnicianService technicians) { this.technicians = technicians; }

    @GetMapping
    public List<TechnicianView> list() { return technicians.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TechnicianView create(@Valid @RequestBody TechnicianInput input) { return technicians.create(input); }

    @PutMapping("/{id}")
    public TechnicianView update(@PathVariable UUID id, @Valid @RequestBody TechnicianInput input) {
        return technicians.update(id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { technicians.delete(id); }
}
