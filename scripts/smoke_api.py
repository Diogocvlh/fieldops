"""Valida o contrato HTTP do FieldOps em uma instância LOCAL de demonstração.

Execute com a API demo ligada: python scripts/smoke_api.py
Cria registros fictícios identificados e os remove ao finalizar.
"""

from datetime import date, timedelta
import json
import urllib.error
import urllib.request
import uuid


BASE = "http://localhost:8080/api/v1"


def request(method, route, payload=None, expected=200):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        BASE + route,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Origin": "http://localhost:5173"},
    )
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        content = response.read().decode()
        result = json.loads(content) if content else None
        assert response.status == expected, (method, route, response.status, result)
        return result


def main():
    health = request("GET", "/health")
    assert health["mode"] == "demo", "Este teste só pode alterar a API em modo demo."
    marker = uuid.uuid4().hex[:8].upper()
    technician_id = order_id = None
    try:
        technician = {
            "name": "Técnico de Verificação",
            "registration": "TEST-" + marker,
            "specialty": "Elétrica",
            "region": "Centro",
            "available": False,
            "capacity": 1,
        }
        saved_technician = request("POST", "/technicians", technician, 201)
        technician_id = saved_technician["id"]
        request("POST", "/technicians", {**technician, "registration": technician["registration"].lower()}, 409)
        order = {
            "title": "Verificação HTTP " + marker,
            "description": "Registro fictício temporário do teste de integração.",
            "priority": "HIGH",
            "status": "OPEN",
            "technicianId": None,
            "dueDate": str(date.today() + timedelta(days=3)),
        }
        saved_order = request("POST", "/work-orders", order, 201)
        order_id = saved_order["id"]
        assert saved_order["code"]
        original_code = saved_order["code"]
        failure = request("POST", f"/work-orders/{order_id}/assign", {"technicianId": technician_id}, 409)
        assert failure["detail"], failure
        technician["available"] = True
        request("PUT", f"/technicians/{technician_id}", technician)
        assigned = request("POST", f"/work-orders/{order_id}/assign", {"technicianId": technician_id})
        assert assigned["status"] == "ASSIGNED"
        assert assigned["technicianId"] == technician_id
        request("POST", "/work-orders", {**order, "title": "Outra ordem de verificação", "status": "ASSIGNED", "technicianId": technician_id}, 409)
        request("POST", "/work-orders", {**order, "title": "x"}, 400)
        order.update(technicianId=technician_id, status="COMPLETED")
        completed = request("PUT", f"/work-orders/{order_id}", order)
        assert completed["completedAt"], completed
        assert completed["code"] == original_code
        request("DELETE", f"/technicians/{technician_id}", expected=409)
        snapshot = request("GET", "/snapshot")
        assert any(item["id"] == order_id for item in snapshot["orders"])
        assert any(item.get("workOrderId") == order_id for item in snapshot["activities"])
        request("GET", "/reports?from=" + str(date.today()) + "&to=" + str(date.today()))
        order.update(status="OPEN", technicianId=None)
        reopened = request("PUT", f"/work-orders/{order_id}", order)
        assert reopened["completedAt"] is None
        assert reopened["technicianId"] is None
        print("OK: criação, matrícula única, validação, disponibilidade, capacidade, atribuição, conclusão, histórico, relatório e reabertura.")
    finally:
        if order_id:
            request("DELETE", f"/work-orders/{order_id}", expected=204)
        if technician_id:
            request("DELETE", f"/technicians/{technician_id}", expected=204)


if __name__ == "__main__":
    main()
