<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ArProduct;
use App\Models\ArCategory;
use App\Services\Bunny;

class UploadExistingImagesToBunny extends Command
{
    protected $signature = 'bunny:upload-existing';
    protected $description = 'Upload existing local product images to Bunny CDN and save their CDN URLs';

    public function handle()
    {
        $this->info("Starting upload...");

        $products = ArCategory::whereNotNull('cat_banner_image')->get();
        $bunny = new Bunny();

        foreach ($products as $product) {
            $img = $product->cat_banner_image;
            // $filename = basename($img);
            $localFile = public_path('img/uploads/category/' . $img);

            if (!file_exists($localFile)) {
                $this->error("File missing: " . $localFile);
                continue;
            }

            // Bunny path inside storage
            $bunnyPath = 'category/' . $img;

            // Upload
            $cdnUrl = $bunny->upload($bunnyPath, file_get_contents($localFile));

            if (!$cdnUrl) {
                $this->error("Failed: " . $product->cat_banner_image);
                continue;
            }

            // Save URL in database
            $product->cat_banner_cdn = $cdnUrl;
            $product->save();

            $this->info("Uploaded: {$product->cat_banner_image} → {$cdnUrl}");
        }

        $this->info("All done!");
    }
}
