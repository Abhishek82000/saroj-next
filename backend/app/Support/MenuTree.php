<?php

namespace App\Support;

class MenuTree
{
    /**
     * Turns a flat array of menu rows (each with menu_id / menu_parent)
     * into a nested tree. Same algorithm as Controller::buildTreeWeb,
     * pulled out so it isn't duplicated between the Blade base controller
     * and the API controller.
     */
    public static function build(array $elements, int $parentId = 0): array
    {
        $branch = [];

        foreach ($elements as $element) {
            if ($element['menu_parent'] == $parentId) {
                $children = self::build($elements, $element['menu_id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[] = $element;
            }
        }

        return $branch;
    }
}
