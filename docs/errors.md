####Error example:
```json
{
  "ok": false,
  "code": 400031,
  "msg": "Invalid date.",
  "data": {}
}
```

###400:
- 400000: Invalid params
```json
{
  "errors": [{
    "field": "date",
    "reason": "required"
  }]  
}
```
- 400001: User already exists
- 400002: Already following
