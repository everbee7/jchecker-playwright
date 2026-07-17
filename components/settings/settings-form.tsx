"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { TechnologyCategory } from "@/types/job";
import type { TechnologyCatalogItem } from "@/types/settings";
type Editable = Omit<AppSettings, "_id">;
export function SettingsForm() {
  const [value, setValue] = useState<Editable>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wanted, setWanted] = useState("");
  const [unwanted, setUnwanted] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const toast = useToast();
  useEffect(() => {
    fetch("/api/settings")
      .then(async (response) => {
        const data = (await response.json()) as AppSettings & {
          error?: string;
        };
        if (!response.ok) throw new Error(data.error);
        setValue(data);
      })
      .catch((error) =>
        toast(
          error instanceof Error ? error.message : "Could not load settings",
          "error",
        ),
      )
      .finally(() => setLoading(false));
  }, [toast]);
  function add(
    kind: "wantedTechnologies" | "unwantedTechnologies",
    text: string,
  ) {
    const item = text.trim();
    if (
      !item ||
      value[kind].some((x) => x.toLowerCase() === item.toLowerCase())
    )
      return;
    setValue((v) => ({ ...v, [kind]: [...v[kind], item] }));
    if (kind === "wantedTechnologies") setWanted("");
    else setUnwanted("");
  }
  function setTechnologyPreference(
    technology: string,
    preference: "wanted" | "unwanted",
  ) {
    const lower = technology.toLowerCase();
    setValue((current) => {
      const isWanted = current.wantedTechnologies.some(
        (item) => item.toLowerCase() === lower,
      );
      const isUnwanted = current.unwantedTechnologies.some(
        (item) => item.toLowerCase() === lower,
      );
      return {
        ...current,
        wantedTechnologies:
          preference === "wanted" && !isWanted
            ? [
                ...current.wantedTechnologies.filter(
                  (item) => item.toLowerCase() !== lower,
                ),
                technology,
              ]
            : current.wantedTechnologies.filter(
                (item) => item.toLowerCase() !== lower,
              ),
        unwantedTechnologies:
          preference === "unwanted" && !isUnwanted
            ? [
                ...current.unwantedTechnologies.filter(
                  (item) => item.toLowerCase() !== lower,
                ),
                technology,
              ]
            : current.unwantedTechnologies.filter(
                (item) => item.toLowerCase() !== lower,
              ),
      };
    });
  }
  function addCatalogTechnology(technology: TechnologyCatalogItem) {
    if (
      value.technologyCatalog.some(
        (item) => item.name.toLowerCase() === technology.name.toLowerCase(),
      )
    ) {
      toast(`${technology.name} already exists in the catalog`, "error");
      return false;
    }
    setValue((current) => ({
      ...current,
      technologyCatalog: [...current.technologyCatalog, technology],
    }));
    return true;
  }
  function deleteCatalogTechnology(technology: string) {
    if (value.technologyCatalog.length <= 1) {
      toast("The catalog must contain at least one technology", "error");
      return;
    }
    if (!confirm(`Delete ${technology} from the detection catalog?`)) return;
    const lower = technology.toLowerCase();
    setValue((current) => ({
      ...current,
      technologyCatalog: current.technologyCatalog.filter(
        (item) => item.name.toLowerCase() !== lower,
      ),
      wantedTechnologies: current.wantedTechnologies.filter(
        (item) => item.toLowerCase() !== lower,
      ),
      unwantedTechnologies: current.unwantedTechnologies.filter(
        (item) => item.toLowerCase() !== lower,
      ),
    }));
  }
  async function save() {
    setSaving(true);
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (response.ok) toast("Settings saved");
    else toast(data.error ?? "Could not save settings", "error");
  }
  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    );
  return (
    <div className="space-y-5">
      <TechnologyCard
        title="Wanted technologies"
        description="These technologies increase a job’s match score."
        values={value.wantedTechnologies}
        tone="green"
        input={wanted}
        setInput={setWanted}
        add={() => add("wantedTechnologies", wanted)}
        remove={(item) =>
          setValue((v) => ({
            ...v,
            wantedTechnologies: v.wantedTechnologies.filter((x) => x !== item),
          }))
        }
      />
      <TechnologyCard
        title="Unwanted technologies"
        description="These technologies reduce a job’s match score."
        values={value.unwantedTechnologies}
        tone="red"
        input={unwanted}
        setInput={setUnwanted}
        add={() => add("unwantedTechnologies", unwanted)}
        remove={(item) =>
          setValue((v) => ({
            ...v,
            unwantedTechnologies: v.unwantedTechnologies.filter(
              (x) => x !== item,
            ),
          }))
        }
      />
      <TechnologyCatalog
        catalog={value.technologyCatalog}
        search={catalogSearch}
        setSearch={setCatalogSearch}
        wanted={value.wantedTechnologies}
        unwanted={value.unwantedTechnologies}
        setPreference={setTechnologyPreference}
        addTechnology={addCatalogTechnology}
        deleteTechnology={deleteCatalogTechnology}
      />
      <Card className="p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Settings2 className="h-4 w-4 text-brand-600" />
          Scraping controls
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Balance throughput against job-site rate limits and available memory.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Concurrent jobs
            <input
              type="number"
              min={1}
              max={10}
              value={value.scrapingConcurrency}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  scrapingConcurrency: Number(e.target.value),
                }))
              }
              className="mt-2 block h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
            />
            <span className="mt-1 block text-xs font-normal text-slate-400">
              1–10; default is 3.
            </span>
          </label>
          <label className="text-sm font-semibold">
            Request timeout (milliseconds)
            <input
              type="number"
              min={3000}
              max={60000}
              step={1000}
              value={value.requestTimeoutMs}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  requestTimeoutMs: Number(e.target.value),
                }))
              }
              className="mt-2 block h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-brand-500"
            />
            <span className="mt-1 block text-xs font-normal text-slate-400">
              3,000–60,000 ms.
            </span>
          </label>
        </div>
      </Card>
      <div className="fixed bottom-5 right-5 z-40 flex flex-wrap justify-end gap-2 rounded-xl border border-slate-200 bg-[#202a44]/95 p-2 shadow-2xl backdrop-blur-md">
        <Button
          variant="secondary"
          onClick={() => setValue({ ...DEFAULT_SETTINGS })}
        >
          <RotateCcw className="h-4 w-4" />
          Reset defaults
        </Button>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
const categoryOrder: TechnologyCategory[] = [
  "frontend",
  "backend",
  "language",
  "database",
  "cloud",
  "devops",
  "mobile",
  "testing",
  "architecture",
  "other",
];

function TechnologyCatalog({
  catalog,
  search,
  setSearch,
  wanted,
  unwanted,
  setPreference,
  addTechnology,
  deleteTechnology,
}: {
  catalog: TechnologyCatalogItem[];
  search: string;
  setSearch: (value: string) => void;
  wanted: string[];
  unwanted: string[];
  setPreference: (
    technology: string,
    preference: "wanted" | "unwanted",
  ) => void;
  addTechnology: (technology: TechnologyCatalogItem) => boolean;
  deleteTechnology: (technology: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] =
    useState<TechnologyCategory>("frontend");
  const [newAliases, setNewAliases] = useState("");
  const query = search.trim().toLowerCase();
  const uniqueTechnologies = [
    ...new Map(
      catalog.map((technology) => [technology.name, technology]),
    ).values(),
  ];
  const visible = uniqueTechnologies.filter(
    (technology) =>
      !query ||
      technology.name.toLowerCase().includes(query) ||
      technology.category.includes(query) ||
      technology.aliases.some((alias) => alias.toLowerCase().includes(query)),
  );
  const wantedSet = new Set(wanted.map((item) => item.toLowerCase()));
  const unwantedSet = new Set(unwanted.map((item) => item.toLowerCase()));

  return (
    <Card className="overflow-hidden border-t-2 border-t-amber-500/80">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold">Detected technology catalog</h2>
            <p className="mt-1 text-sm text-slate-500">
              Loaded from MongoDB. These {uniqueTechnologies.length} entries are
              the rules JobChecker currently uses for analysis. Save changes to
              persist additions or deletions.
            </p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search technologies or aliases…"
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
            />
          </label>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-slate-50/40 px-5 py-4">
        <div className="grid gap-2 md:grid-cols-[1fr_180px_1.5fr_auto]">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Technology name"
            maxLength={80}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-amber-500"
          />
          <select
            value={newCategory}
            onChange={(event) =>
              setNewCategory(event.target.value as TechnologyCategory)
            }
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-amber-500"
          >
            {categoryOrder.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            value={newAliases}
            onChange={(event) => setNewAliases(event.target.value)}
            placeholder="Aliases separated by commas"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-amber-500"
          />
          <Button
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              const added = addTechnology({
                name: newName.trim(),
                category: newCategory,
                aliases: [
                  ...new Set(
                    newAliases
                      .split(",")
                      .map((alias) => alias.trim())
                      .filter(Boolean),
                  ),
                ],
              });
              if (added) {
                setNewName("");
                setNewAliases("");
              }
            }}
          >
            <Plus className="h-4 w-4" />
            Add detector
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          The technology name is always matched. Add spelling variants and
          abbreviations as aliases.
        </p>
      </div>
      <div className="space-y-6 p-5">
        {categoryOrder.map((category) => {
          const technologies = visible.filter(
            (technology) => technology.category === category,
          );
          if (!technologies.length) return null;
          return (
            <section key={category}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {category}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {technologies.length}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {technologies.map((technology) => {
                  const isWanted = wantedSet.has(technology.name.toLowerCase());
                  const isUnwanted = unwantedSet.has(
                    technology.name.toLowerCase(),
                  );
                  return (
                    <div
                      key={technology.name}
                      className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5"
                    >
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-semibold"
                        title={technology.aliases.join(", ")}
                      >
                        {technology.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreference(technology.name, "wanted")}
                        className={
                          isWanted
                            ? "rounded-md bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30"
                            : "rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        }
                      >
                        Wanted
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPreference(technology.name, "unwanted")
                        }
                        className={
                          isUnwanted
                            ? "rounded-md bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-300 ring-1 ring-red-400/30"
                            : "rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        }
                      >
                        Unwanted
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTechnology(technology.name)}
                        aria-label={`Delete ${technology.name}`}
                        title={`Delete ${technology.name}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!visible.length && (
          <div className="py-10 text-center text-sm text-slate-500">
            No detected technologies match “{search}”.
          </div>
        )}
      </div>
    </Card>
  );
}
function TechnologyCard({
  title,
  description,
  values,
  tone,
  input,
  setInput,
  add,
  remove,
}: {
  title: string;
  description: string;
  values: string[];
  tone: "green" | "red";
  input: string;
  setInput: (v: string) => void;
  add: () => void;
  remove: (v: string) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.map((item) => (
          <Badge key={item} tone={tone} className="gap-1.5 py-1.5">
            {item}
            <button
              onClick={() => remove(item)}
              aria-label={`Remove ${item}`}
              className="rounded hover:bg-black/10"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex max-w-md gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a technology"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
        />
        <Button variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </Card>
  );
}
