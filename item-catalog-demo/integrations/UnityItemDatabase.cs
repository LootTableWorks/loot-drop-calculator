using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

[Serializable]
public class FantasyItem
{
    public string schema_version;
    public string id;
    public string family_id;
    public string name;
    public string category;
    public string object_type;
    public string rarity;
    public int tier;
    public string biome;
    public string faction_affinity;
    public string state;
    public string[] composition;
    public string material_class;
    public string[] crafting_roles;
    public string[] compatible_disciplines;
    public string durability_class;
    public string weight_class;
    public string function;
    public string mechanical_hook;
    public string trade_use;
    public string quest_use;
    public string visual_identity;
    public string tone;
    public string[] tags;
    public string short_description;
    public string table_description;
    public string effect;
    public string drawback;
    public string[] salvage_outputs;
    public int base_value;
    public float scarcity_multiplier;
    public int suggested_value;
    public int stack_limit;
    public int value;
    public float weight;
    public string source_table;
}

[Serializable]
internal class FantasyItemArray
{
    public FantasyItem[] items;
}

public class UnityItemDatabase : MonoBehaviour
{
    [SerializeField] private string resourcesFileName = "items";
    public IReadOnlyList<FantasyItem> Items => items;

    private readonly List<FantasyItem> items = new();

    private void Awake()
    {
        LoadFromResources();
    }

    public void LoadFromResources()
    {
        TextAsset jsonFile = Resources.Load<TextAsset>(resourcesFileName);
        if (jsonFile == null)
        {
            Debug.LogError($"Item database not found at Resources/{resourcesFileName}.json");
            return;
        }

        string wrappedJson = "{\"items\":" + jsonFile.text + "}";
        FantasyItemArray parsed = JsonUtility.FromJson<FantasyItemArray>(wrappedJson);
        items.Clear();
        if (parsed?.items != null)
        {
            items.AddRange(parsed.items);
        }
    }

    public FantasyItem FindById(string id)
    {
        return items.FirstOrDefault(item => item.id == id);
    }

    public List<FantasyItem> FindByCategory(string category)
    {
        return items.Where(item => item.category == category).ToList();
    }

    public List<FantasyItem> FindByCraftingRole(string role)
    {
        return items.Where(item => item.crafting_roles != null && item.crafting_roles.Contains(role)).ToList();
    }

    public List<FantasyItem> FindByBiome(string biome)
    {
        return items.Where(item => item.biome == biome).ToList();
    }

    public FantasyItem RandomItem()
    {
        return items.Count == 0 ? null : items[UnityEngine.Random.Range(0, items.Count)];
    }
}
