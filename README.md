# Olio2-Image-Manager

## use this

1. POST /image

```json
{  
  "name" : "some_image",  
  "type" : "jpg"
}
```

and get url

```json
{
    "success": true,
    "code": "OLIO-000",
    "message": "요청이 성공적으로 이루어졌습니다.",
    "data": {
        "url": "some url"
    }
}
```

2. PUT /{json.data.url}

with picture

example
```js
fetch(json.uploadURL, {
  method: "PUT",
  body: new Blob([reader.result], {type: file.type})
})
```
