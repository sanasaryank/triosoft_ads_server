# API Reference

**Base URL:** `https://ads.trio.am/dev`

All requests include the header `X-Origin: ads.trio.am`.  
Authentication is session-based (cookie). The login endpoint uses HTTP Basic Auth.

---

## Auth

### POST /login
Authenticates the user. Credentials are sent as `Authorization: Basic <base64(username:password)>`.

**Request body:** _(none)_

**Response:** _(empty 200 on success)_

---

### POST /logout

**Request body:** _(none)_

**Response:** _(empty 200 on success)_

---

### GET /me

**Response:**
```json
{
  "id": "user-uuid",
  "username": "admin",
  "name": {
    "ARM": "Անուն",
    "ENG": "Name",
    "RUS": "Имя"
  }
}
```

---

## Advertisers

### GET /advertiser

**Response:**
```json
[
  {
    "id": "adv-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "TIN": "12345678",
    "description": "Description text",
    "isBlocked": false,
    "hash": "abc123"
  }
]
```

---

### GET /advertiser/:id

**Response:**
```json
{
  "id": "adv-uuid",
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "TIN": "12345678",
  "description": "Description text",
  "isBlocked": false,
  "hash": "abc123"
}
```

---

### POST /advertiser

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "TIN": "12345678",
  "description": "Description text"
}
```

**Response:** _(same as GET /advertiser/:id)_

---

### PUT /advertiser/:id

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "TIN": "12345678",
  "description": "Description text",
  "hash": "abc123"
}
```

**Response:** _(same as GET /advertiser/:id)_

---

### PATCH /advertiser/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Campaigns

### GET /campaign

**Response:**
```json
[
  {
    "id": "camp-uuid",
    "advertiserId": "adv-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "description": "Description text",
    "startDate": 1700000000,
    "endDate": 1710000000,
    "budget": 10000.00,
    "budgetDaily": 500.00,
    "price": 1.50,
    "pricingModel": "CPM",
    "spendStrategy": "even",
    "frequencyCapStrategy": "soft",
    "frequencyCap": {
      "per_user": {
        "impressions": { "count": 3, "window_sec": 3600 },
        "clicks": { "count": 1, "window_sec": 3600 }
      },
      "per_session": {
        "impressions": { "count": 1, "window_sec": 900 },
        "clicks": { "count": 1, "window_sec": 3600 }
      }
    },
    "priority": 1,
    "weight": 1.0,
    "overdeliveryRatio": 1.0,
    "locationsMode": "allowed",
    "locations": ["district-uuid-1", "district-uuid-2"],
    "restaurantTypesMode": "denied",
    "restaurantTypes": [],
    "menuTypesMode": "denied",
    "menuTypes": [],
    "slots": ["slot-uuid-1"],
    "targets": [
      {
        "id": "target-uuid",
        "slots": [
          {
            "id": "slot-uuid-1",
            "schedules": ["sched-uuid-1"],
            "placements": ["place-uuid-1"]
          }
        ]
      }
    ],
    "isBlocked": false,
    "hash": "abc123"
  }
]
```

---

### GET /campaign/:id

**Response:** _(same as single item above)_

---

### POST /campaign

**Request body:**
```json
{
  "advertiserId": "adv-uuid",
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "description": "Description text",
  "startDate": 1700000000,
  "endDate": 1710000000,
  "budget": 10000.00,
  "budgetDaily": 500.00,
  "price": 1.50,
  "pricingModel": "CPM",
  "spendStrategy": "even",
  "frequencyCapStrategy": "soft",
  "frequencyCap": {
    "per_user": {
      "impressions": { "count": 3, "window_sec": 3600 },
      "clicks": { "count": 1, "window_sec": 3600 }
    },
    "per_session": {
      "impressions": { "count": 1, "window_sec": 900 },
      "clicks": { "count": 1, "window_sec": 3600 }
    }
  },
  "priority": 1,
  "weight": 1.0,
  "overdeliveryRatio": 1.0,
  "locationsMode": "allowed",
  "locations": ["district-uuid-1"],
  "restaurantTypesMode": "denied",
  "restaurantTypes": [],
  "menuTypesMode": "denied",
  "menuTypes": [],
  "slots": ["slot-uuid-1"],
  "targets": []
}
```

**Response:** _(same as GET /campaign/:id)_

---

### PUT /campaign/:id

**Request body:** _(same as POST /campaign, add `"hash": "abc123"`)_

**Response:** _(same as GET /campaign/:id)_

---

### PATCH /campaign/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Creatives

### GET /creative

**Response:**
```json
[
  {
    "id": "creat-uuid",
    "campaignId": "camp-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "language": "ENG",
    "indexFile": "index.html",
    "minHeight": 100,
    "maxHeight": 300,
    "minWidth": 200,
    "maxWidth": 600,
    "previewWidth": 300,
    "previewHeight": 150,
    "isBlocked": false
  }
]
```

---

### GET /creative/:id

**Response:**
```json
{
  "id": "creat-uuid",
  "campaignId": "camp-uuid",
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "language": "ENG",
  "indexFile": "index.html",
  "minHeight": 100,
  "maxHeight": 300,
  "minWidth": 200,
  "maxWidth": 600,
  "previewWidth": 300,
  "previewHeight": 150,
  "isBlocked": false,
  "files": ["index.html", "style.css", "banner.png"],
  "hash": "abc123"
}
```

---

### POST /creative

**Request body:**
```json
{
  "campaignId": "camp-uuid",
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "language": "ENG",
  "indexFile": "index.html",
  "files": [
    { "name": "index.html", "contents": "<base64-encoded-content>" },
    { "name": "style.css", "contents": "<base64-encoded-content>" }
  ],
  "minHeight": 100,
  "maxHeight": 300,
  "minWidth": 200,
  "maxWidth": 600,
  "previewWidth": 300,
  "previewHeight": 150
}
```

**Response:** _(same as GET /creative — list item shape, without files/hash)_

---

### PUT /creative/:id

**Request body:** _(same as POST /creative, add `"hash": "abc123"`; existing files omit `contents`)_

```json
{
  "campaignId": "camp-uuid",
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "language": "ENG",
  "indexFile": "index.html",
  "files": [
    { "name": "index.html" },
    { "name": "new-file.js", "contents": "<base64-encoded-content>" }
  ],
  "minHeight": 100,
  "maxHeight": 300,
  "minWidth": 200,
  "maxWidth": 600,
  "previewWidth": 300,
  "previewHeight": 150,
  "hash": "abc123"
}
```

**Response:** _(same as GET /creative — list item shape)_

---

### PATCH /creative/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Platforms

### GET /platform

**Response:**
```json
[
  {
    "id": "plat-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "description": "Description text",
    "isBlocked": false,
    "hash": "abc123"
  }
]
```

---

### GET /platform/:id

**Response:** _(same as single item above)_

---

### POST /platform

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "description": "Description text",
  "isBlocked": false
}
```

**Response:** _(same as GET /platform/:id)_

---

### PUT /platform/:id

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "description": "Description text",
  "isBlocked": false,
  "hash": "abc123"
}
```

**Response:** _(same as GET /platform/:id)_

---

### PATCH /platform/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Slots

### GET /slot

**Response:**
```json
[
  {
    "id": "slot-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "type": "MainBig",
    "platformId": "plat-uuid",
    "rotationPeriod": 10,
    "refreshTTL": 60,
    "noAdjacentSameAdvertiser": true,
    "description": "Description text",
    "isBlocked": false,
    "hash": "abc123"
  }
]
```

> `type` values: `"MainBig"` | `"MainSmall"` | `"Group"` | `"Selection"`

---

### GET /slot/:id

**Response:** _(same as single item above)_

---

### POST /slot

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "type": "MainBig",
  "platformId": "plat-uuid",
  "rotationPeriod": 10,
  "refreshTTL": 60,
  "noAdjacentSameAdvertiser": true,
  "description": "Description text"
}
```

**Response:** _(same as GET /slot/:id)_

---

### PUT /slot/:id

**Request body:** _(same as POST /slot, add `"hash": "abc123"`)_

**Response:** _(same as GET /slot/:id)_

---

### PATCH /slot/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Schedules

### GET /schedule

**Response:**
```json
[
  {
    "id": "sched-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "color": "#FF5733",
    "weekSchedule": [
      { "day": "Mon", "enabled": true, "start": 28800, "end": 64800 },
      { "day": "Tue", "enabled": true, "start": 28800, "end": 64800 },
      { "day": "Wed", "enabled": true, "start": 28800, "end": 64800 },
      { "day": "Thu", "enabled": true, "start": 28800, "end": 64800 },
      { "day": "Fri", "enabled": true, "start": 28800, "end": 64800 },
      { "day": "Sat", "enabled": false, "start": 0, "end": 0 },
      { "day": "Sun", "enabled": false, "start": 0, "end": 0 }
    ],
    "isBlocked": false,
    "hash": "abc123"
  }
]
```

> `start` / `end` are seconds-since-midnight (e.g. `28800` = 08:00).  
> `day` values: `"Mon"` | `"Tue"` | `"Wed"` | `"Thu"` | `"Fri"` | `"Sat"` | `"Sun"`

---

### GET /schedule/:id

**Response:** _(same as single item above)_

---

### POST /schedule

**Request body:**
```json
{
  "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
  "color": "#FF5733",
  "weekSchedule": [
    { "day": "Mon", "enabled": true, "start": 28800, "end": 64800 },
    { "day": "Tue", "enabled": true, "start": 28800, "end": 64800 },
    { "day": "Wed", "enabled": true, "start": 28800, "end": 64800 },
    { "day": "Thu", "enabled": true, "start": 28800, "end": 64800 },
    { "day": "Fri", "enabled": true, "start": 28800, "end": 64800 },
    { "day": "Sat", "enabled": false, "start": 0, "end": 0 },
    { "day": "Sun", "enabled": false, "start": 0, "end": 0 }
  ]
}
```

**Response:** _(same as GET /schedule/:id)_

---

### PUT /schedule/:id

**Request body:** _(same as POST /schedule, add `"hash": "abc123"`)_

**Response:** _(same as GET /schedule/:id)_

---

### PATCH /schedule/:id/block

**Request body:**
```json
{ "isBlocked": true }
```

**Response:** _(empty 200 on success)_

---

## Placements

### GET /placements

**Response:**
```json
[
  {
    "id": "place-uuid",
    "name": { "ARM": "Անուն", "ENG": "Name", "RUS": "Имя" },
    "cityName": "Yerevan",
    "districtName": "Kentron",
    "isBlocked": false
  }
]
```

---

## Locations

### GET /locations

**Response:**
```json
{
  "countries": [
    { "id": "country-uuid", "name": "Armenia", "isBlocked": false }
  ],
  "cities": [
    { "id": "city-uuid", "name": "Yerevan", "isBlocked": false, "countryId": "country-uuid" }
  ],
  "districts": [
    { "id": "district-uuid", "name": "Kentron", "isBlocked": false, "cityId": "city-uuid" }
  ]
}
```

---

## Dictionaries

### GET /dictionary/restaurant-types

**Response:**
```json
[
  {
    "id": "dict-uuid",
    "name": { "ARM": "Ռեստորան", "ENG": "Restaurant", "RUS": "Ресторан" },
    "description": "Full-service restaurant",
    "isBlocked": false
  }
]
```

---

### GET /dictionary/menu-types

**Response:** _(same shape as /dictionary/restaurant-types)_

---

### GET /dictionary/price-segments

**Response:** _(same shape as /dictionary/restaurant-types)_

---

### GET /dictionary/integration-types

**Response:** _(same shape as /dictionary/restaurant-types)_

---

## Error Response

All endpoints may return an error in the following shape:

```json
{
  "message": "Validation failed",
  "details": {}
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized — redirected to `/login` |
| 404 | Not found |
| 500 | Internal server error |
| 502 | Bad gateway — redirected to `/login` |
