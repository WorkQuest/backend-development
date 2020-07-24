# Hapi starter kit

## Rest way

### Методы запросов
`GET` - используем только query (ex: `/api/projects?offset=10&limit=8&order=asc`) (получение информации).
В случае каких-то сложных json объектов `strinfgify()` и `encode()`

`POST` - json (создание/действие)

`PUT` - json (изменение объекта)

`DELETE` - в случае необходимости используем json (удаление объекта)

### Стандарт ответов от сервера
Стандартный ответ сервера (200):
```json
{
  "ok": true,
  "result": {}
}
```
Используйте заготовку `outputOkSchema(Joi.object({}))`


Стандартный ответ с ошибкой:
```json
{
  "ok": false,
  "code": 400031,
  "msg": "Invalid date.",
  "data": {}
}
```
TODO: описать документирование ошибок

Поле `code` представляет собой HTTP код (400) в первой половине и идентификатор конкретной ошибки (031) во второй половине.
Все возможные ошибки (за исключением общих ошибок сервера, маркирующихся 000) должны быть описаны в файле `ERRORS.md` в корне репозитория,
а также рекомендуется перечислять возможные ошибки в описании методов в документации.

### Пагинация
`GET - /api/projects?offset=10&limit=10`

Стандартный ответ с пагинацией:
```json
{
  "ok": true,
  "result": {
    "count": 10,
    "items": []
  }
}
```
Используйте заготовку `outputPaginationSchema('items', Joi.object({}))`

### Ошибки `Invalid payload`

```json
{
  "ok": false,
  "code": 400000,
  "msg": "Invalid payload",
  "data": {
    "errors": [{
      
    }]
  } 
}
```

### Версионирование API
`/api/v1 /api/v2 ...`

Пример версионирования представлен в `api` и `routes`. Каждая новая версия должна указываться в `routes/index.ts`.

### Документация
Документация доступна по адресу `/api/documentation`. Обновите `host` в `swagger.json`.

### Базы данных
TODO: Обсудить возможную миграцию с sequelize в связке с sequelize-typescript на typeorm, в связи 
с обновлением sequelize до v6, и отставанием за ним sequelize-typescript

