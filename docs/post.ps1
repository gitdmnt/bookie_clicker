$url = "http://localhost:3001/api/registerbook";
$headers = @{
    "Content-Type" = "application/json"
    };
Invoke-WebRequest $url -Method POST -Headers $headers -Body '{"user":0, "isbn": "9784588010590"}'