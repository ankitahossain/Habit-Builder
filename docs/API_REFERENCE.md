# API Reference

Base URL: `http://localhost:4000/api`

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/health` | No | API health |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Sign in |
| GET | `/habits` | Yes | List user's active habits and logs |
| POST | `/habits` | Yes | Create habit |
| PATCH | `/habits/:id` | Yes | Update habit |
| DELETE | `/habits/:id` | Yes | Delete habit |
| PUT | `/habits/:id/logs/:date` | Yes | Mark complete or undo |
| GET | `/analytics/weekly` | Yes | Last seven days' planned/completed counts |
| GET | `/analytics/summary` | Yes | Habit count and streak summary |

## Example register request
```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "use-a-private-password"
}
```

## Example create habit request
```json
{
  "name": "Read for 20 minutes",
  "description": "Read before bed",
  "frequency": "daily",
  "target_time": "20:00",
  "color": "#8a70ec"
}
```

## Completion request
`PUT /habits/<habit-id>/logs/2026-10-21`
```json
{ "done": true }
```

Errors use an `error` message and may include `details` for validation failures. Do not put real credentials or tokens in screenshots, reports, or source control.
