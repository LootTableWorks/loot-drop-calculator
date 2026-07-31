class_name LootTableItemDatabase
extends RefCounted

var items: Array = []
var items_by_id: Dictionary = {}


func load_items(json_path: String) -> bool:
    if not FileAccess.file_exists(json_path):
        push_error("Item database not found: " + json_path)
        return false

    var file := FileAccess.open(json_path, FileAccess.READ)
    var parsed = JSON.parse_string(file.get_as_text())
    if typeof(parsed) != TYPE_ARRAY:
        push_error("Expected a top-level JSON array.")
        return false

    items = parsed
    items_by_id.clear()
    for item in items:
        if item is Dictionary and item.has("id"):
            items_by_id[item["id"]] = item
    return true


func find_by_id(item_id: String) -> Dictionary:
    return items_by_id.get(item_id, {})


func filter_by_category(category: String) -> Array:
    return items.filter(func(item): return item.get("category", "") == category)


func filter_by_biome(biome: String) -> Array:
    return items.filter(func(item): return item.get("biome", "") == biome)


func filter_by_crafting_role(role: String) -> Array:
    return items.filter(func(item): return role in item.get("crafting_roles", []))


func crafting_compatible_items() -> Array:
    return items.filter(func(item): return item.get("crafting_roles", ["none"]) != ["none"])


func random_item() -> Dictionary:
    if items.is_empty():
        return {}
    return items.pick_random()
