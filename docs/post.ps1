$url = "http://127.0.0.1:3001/api/registerbook";
$headers = @{
    "Content-Type" = "application/json"
    };
Invoke-WebRequest $url -Method POST -Headers $headers -Body '{"user":0, "isbn": "9784588010590"}'