<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MenuResource extends JsonResource
{
    public function toArray($request): array
    {
        // $this->resource is a plain array here (MenuTree::build works on
        // arrays, built from ->toArray() further up), not an Eloquent
        // model, so pull fields with array access rather than ->prop.
        $menu = $this->resource;

        return [
            'id'         => $menu['menu_id'] ?? null,
            'name'       => $menu['menu_name'] ?? null,
            'order'      => $menu['menu_order'] ?? null,
            'mega'      => $menu['menu_mega'] ?? null,
            'image'      => $menu['menu_image'] ?? null,
            'link'      => $menu['menu_customlink'] ?? null,
            'wholesale'      => $menu['menu_is_wholesale'] ?? null,
            'pages'      => $menu['pages'] ?? [],
            'categories' => $menu['categories'] ?? [],
            'children'   => isset($menu['children'])
                ? MenuResource::collection(collect($menu['children']))
                : [],
        ];
    }
}
