<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class Bunny
{
    private $zone;
    private $password;
    private $storageUrl;
    private $cdnUrl;

    public function __construct()
    {
        $this->zone = 'saroj-store';
        $this->password = '405ca133-2f9c-4f8b-ad044894ac7f-096d-4a70';
        $this->storageUrl = 'https://sg.storage.bunnycdn.com';
        $this->cdnUrl = 'https://saroj-textile-store.b-cdn.net';
    }

    // Upload
    public function upload($path, $fileContent)
{
    $url = "{$this->storageUrl}/{$this->zone}/{$path}";

    $response = Http::withHeaders([
        'AccessKey' => $this->password,
        'Content-Type' => 'application/octet-stream'
    ])->withBody($fileContent, 'application/octet-stream')  // FIX
      ->put($url);

    if ($response->successful()) {
        return $this->cdnUrl . '/' . $path;
    }

    return false;
}


    // Delete
    public function delete($path)
    {
        $url = "{$this->storageUrl}/{$this->zone}/{$path}";

        return Http::withHeaders([
            'AccessKey' => $this->password
        ])->delete($url)->successful();
    }

    // CDN URL
    public function url($path)
    {
        return "{$this->cdnUrl}/{$path}";
    }
}
