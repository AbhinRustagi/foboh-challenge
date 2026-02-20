"use client";

import { useState, useMemo } from "react";
import {
  Search,
  HelpCircle,
  Settings,
  Pencil,
  RefreshCw,
  Info,
  X,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Product,
  AdjustmentMode,
  IncrementMode,
  ProductSelectionType,
} from "@/data/constants";
import { SUB_CATEGORIES, SEGMENTS, BRANDS, BASED_ON_PROFILES } from "@/data/constants";

// Temporary sample data — replace with API fetch when backend is ready
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "High Garden Pinot Noir 2021",
    skuCode: "HGVPIN216",
    brand: "High Garden",
    categoryId: "Alcoholic Beverage",
    subCategoryId: "Wine",
    segmentId: "Red",
    globalWholesalePrice: 279.06,
  },
  {
    id: "2",
    title: "Koyama Methode Brut Nature NV",
    skuCode: "KOYBRUNV6",
    brand: "Koyama Wines",
    categoryId: "Alcoholic Beverage",
    subCategoryId: "Wine",
    segmentId: "Sparkling",
    globalWholesalePrice: 120.0,
  },
  {
    id: "3",
    title: "Koyama Riesling 2018",
    skuCode: "KOYNR1837",
    brand: "Koyama Wines",
    categoryId: "Alcoholic Beverage",
    subCategoryId: "Wine",
    segmentId: "Port/Dessert",
    globalWholesalePrice: 215.04,
  },
  {
    id: "4",
    title: "Koyama Tussock Riesling 2019",
    skuCode: "KOYRIE19",
    brand: "Koyama Wines",
    categoryId: "Alcoholic Beverage",
    subCategoryId: "Wine",
    segmentId: "White",
    globalWholesalePrice: 215.04,
  },
  {
    id: "5",
    title: "Lacourte-Godbillon Brut Cru NV",
    skuCode: "LACBNATNV6",
    brand: "Lacourte-Godbillon",
    categoryId: "Alcoholic Beverage",
    subCategoryId: "Wine",
    segmentId: "Sparkling",
    globalWholesalePrice: 409.32,
  },
];

const BRAND_COLORS: Record<string, string> = {
  "High Garden": "bg-amber-800",
  "Koyama Wines": "bg-indigo-700",
  "Lacourte-Godbillon": "bg-rose-800",
};

function calculateNewPrice(
  basedOnPrice: number,
  adjustment: number,
  mode: AdjustmentMode,
  direction: IncrementMode,
): number {
  let result: number;
  if (mode === "fixed") {
    result = direction === "increase"
      ? basedOnPrice + adjustment
      : basedOnPrice - adjustment;
  } else {
    const delta = (adjustment / 100) * basedOnPrice;
    result = direction === "increase"
      ? basedOnPrice + delta
      : basedOnPrice - delta;
  }
  return Math.max(0, Math.round(result * 100) / 100);
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function PricingSetup() {
  // --- Product selection state ---
  const [selectionType, setSelectionType] = useState<ProductSelectionType>("multiple");
  const [searchQuery, setSearchQuery] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [segmentFilter, setSegmentFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Pricing state ---
  const [basedOn, setBasedOn] = useState("global");
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>("fixed");
  const [incrementMode, setIncrementMode] = useState<IncrementMode>("decrease");
  const [adjustmentValues, setAdjustmentValues] = useState<Record<string, number>>({});
  const defaultAdjustment = 5;

  // --- Products (to be replaced with API fetch) ---
  const products = SAMPLE_PRODUCTS;

  // --- Derived: filtered products ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase();
      const sku = skuFilter.toLowerCase();
      const matchesSearch = !query || p.title.toLowerCase().includes(query) || p.skuCode.toLowerCase().includes(query);
      const matchesSku = !sku || p.skuCode.toLowerCase().includes(sku) || p.title.toLowerCase().includes(sku);
      const matchesCategory = !categoryFilter || p.subCategoryId === categoryFilter;
      const matchesSegment = !segmentFilter || p.segmentId === segmentFilter;
      const matchesBrand = !brandFilter || p.brand === brandFilter;
      return matchesSearch && matchesSku && matchesCategory && matchesSegment && matchesBrand;
    });
  }, [products, searchQuery, skuFilter, categoryFilter, segmentFilter, brandFilter]);

  // --- Derived: active filters for chips ---
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (categoryFilter) activeFilters.push({ label: categoryFilter, clear: () => setCategoryFilter("") });
  if (segmentFilter) activeFilters.push({ label: segmentFilter, clear: () => setSegmentFilter("") });
  if (brandFilter) activeFilters.push({ label: brandFilter, clear: () => setBrandFilter("") });

  // --- Derived: selected products for price table ---
  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  // --- Derived: based-on profile name ---
  const basedOnProfile = BASED_ON_PROFILES.find((p) => p.id === basedOn);
  const basedOnLabel = basedOnProfile?.name ?? "Global Wholesale Price";

  // --- Handlers ---
  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selectionType === "one") {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.clear();
          next.add(id);
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function handleSelectionTypeChange(value: string) {
    const type = value as ProductSelectionType;
    setSelectionType(type);
    if (type === "all") {
      setSelectedIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function getAdjustment(productId: string): number {
    return adjustmentValues[productId] ?? defaultAdjustment;
  }

  function setProductAdjustment(productId: string, value: number) {
    setAdjustmentValues((prev) => ({ ...prev, [productId]: value }));
  }

  function getBasedOnPrice(product: Product): number {
    return product.globalWholesalePrice;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between bg-foboh px-6 py-3 text-white">
        <div>
          <p className="text-base font-semibold">Hello, Ekemini</p>
          <p className="text-xs text-white/80">Tue, 13 February 2024</p>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" className="rounded-full bg-white/20 p-2">
            <HelpCircle className="size-4" />
          </button>
          <button type="button" className="rounded-full bg-white/20 p-2">
            <Settings className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs">
              <p className="font-medium">Ekemini Mark</p>
              <p className="text-white/70">Heaps Normal</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-600 text-sm font-bold">
              EM
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Breadcrumb + actions */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Pricing Profile</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">Setup a Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="mt-1 text-sm text-muted-foreground">
              Setup your pricing profile, select products and assign customers
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button variant="outline" size="sm">Save as Draft</Button>
          </div>
        </div>

        {/* ── Step 1: Basic Pricing Profile ── */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Basic Pricing Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Cheeky little description goes in here
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-emerald-600">Completed</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">You&apos;ve created a Price Profile</p>
                <p className="text-base font-semibold">Heaps Normal #4</p>
                <p className="text-sm text-muted-foreground">
                  Marked as <span className="font-medium text-foreground">Default</span>, and expires in{" "}
                  <span className="font-medium text-foreground">18 Days</span> (Date Here)
                </p>
              </div>
              <button type="button" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Pencil className="size-3.5" />
                Make Changes
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Step 2: Set Product Pricing ── */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Set Product Pricing</h2>
            <p className="text-sm text-muted-foreground">Set details</p>
            <Separator className="my-4" />

            {/* Selection type */}
            <div className="mb-6">
              <Label className="mb-2 block text-sm">You are creating a Pricing Profile for</Label>
              <RadioGroup
                value={selectionType}
                onValueChange={handleSelectionTypeChange}
                className="flex gap-6"
              >
                {[
                  { value: "one", label: "One Product" },
                  { value: "multiple", label: "Multiple Products" },
                  { value: "all", label: "All Products" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`sel-${opt.value}`} />
                    <Label htmlFor={`sel-${opt.value}`} className="cursor-pointer text-sm">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Search & filters */}
            {selectionType !== "all" && (
              <div className="mb-4">
                <Label className="mb-2 block text-sm">Search for Products</Label>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-40 pl-9"
                    />
                  </div>
                  <Input
                    placeholder="Product / SKU"
                    value={skuFilter}
                    onChange={(e) => setSkuFilter(e.target.value)}
                    className="w-36"
                  />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUB_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Results count + active filter chips */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span>
                Showing <span className="font-semibold">({filteredProducts.length} Result{filteredProducts.length !== 1 ? "s" : ""})</span>
                {(searchQuery || skuFilter) && (
                  <> for <span className="font-medium">{searchQuery || skuFilter}</span></>
                )}
              </span>
              {activeFilters.map((f) => (
                <Badge key={f.label} variant="secondary" className="gap-1 pl-2 pr-1">
                  {f.label}
                  <button type="button" onClick={f.clear} className="rounded-full p-0.5 hover:bg-muted">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Select/deselect all */}
            {selectionType !== "one" && (
              <div className="mb-3 flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={deselectAll}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <span className="flex size-4 items-center justify-center rounded-full border">
                    <X className="size-2.5" />
                  </span>
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <span className="flex size-4 items-center justify-center rounded-full border">
                    <span className="size-2 rounded-full bg-current" />
                  </span>
                  Select all
                </button>
              </div>
            )}

            {/* Product list */}
            <div className="mb-4 space-y-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const color = BRAND_COLORS[product.brand] ?? "bg-gray-500";
                return (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${color}`}>
                      {product.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU {product.skuCode} &middot; {product.subCategoryId} &middot; {product.segmentId}
                      </p>
                    </div>
                  </label>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No products match your filters.
                </p>
              )}
            </div>

            {/* Selected count */}
            {selectedProducts.length > 0 && (
              <p className="mb-4 text-sm">
                You&apos;ve selected <span className="font-semibold">{selectedProducts.length} Product{selectedProducts.length !== 1 ? "s" : ""}</span>,
                these will be added <span className="font-medium">(Heaps Normal #4)</span>
              </p>
            )}

            <Separator className="my-6" />

            {/* Based on */}
            <div className="mb-6">
              <Label className="mb-2 block text-sm">Based on</Label>
              <Select value={basedOn} onValueChange={setBasedOn}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASED_ON_PROFILES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adjustment mode */}
            <div className="mb-4">
              <Label className="mb-2 block text-sm">Set Price Adjustment Mode</Label>
              <RadioGroup
                value={adjustmentMode}
                onValueChange={(v) => setAdjustmentMode(v as AdjustmentMode)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fixed" id="adj-fixed" />
                  <Label htmlFor="adj-fixed" className="cursor-pointer text-sm">Fixed ($)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dynamic" id="adj-dynamic" />
                  <Label htmlFor="adj-dynamic" className="cursor-pointer text-sm">Dynamic (%)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Increment mode */}
            <div className="mb-4">
              <Label className="mb-2 block text-sm">Set Price Adjustment Increment Mode</Label>
              <RadioGroup
                value={incrementMode}
                onValueChange={(v) => setIncrementMode(v as IncrementMode)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="increase" id="inc-increase" />
                  <Label htmlFor="inc-increase" className="cursor-pointer text-sm">Increase +</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="decrease" id="inc-decrease" />
                  <Label htmlFor="inc-decrease" className="cursor-pointer text-sm">Decrease -</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Info notice */}
            <div className="mb-6 flex items-center gap-2 text-sm">
              <Info className="size-4 shrink-0 text-amber-500" />
              <span>
                The adjusted price will be calculated from{" "}
                <span className="font-semibold text-foboh">{basedOnLabel}</span>{" "}
                selected above
              </span>
            </div>

            {/* Refresh button */}
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-foboh hover:underline"
              >
                Refresh New Price Table
                <RefreshCw className="size-3.5" />
              </button>
            </div>

            {/* Price table */}
            {selectedProducts.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) selectAll();
                            else deselectAll();
                          }}
                        />
                      </TableHead>
                      <TableHead>Product Title</TableHead>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">{basedOnLabel}</TableHead>
                      <TableHead className="text-center">Adjustment</TableHead>
                      <TableHead className="text-right">New Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((product) => {
                      const basedOnPrice = getBasedOnPrice(product);
                      const adj = getAdjustment(product.id);
                      const newPrice = calculateNewPrice(basedOnPrice, adj, adjustmentMode, incrementMode);
                      const sign = incrementMode === "decrease" ? "-" : "+";
                      const symbol = adjustmentMode === "fixed" ? "$" : "%";

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{product.title}</TableCell>
                          <TableCell className="text-muted-foreground">{product.skuCode}</TableCell>
                          <TableCell className="text-muted-foreground">{product.subCategoryId}</TableCell>
                          <TableCell className="text-right">{formatCurrency(basedOnPrice)}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-1 rounded bg-foboh/10 px-3 py-1.5 text-sm text-foboh">
                              <span>{sign}{adjustmentMode === "fixed" ? "$ " : ""}</span>
                              <input
                                type="number"
                                value={adj}
                                onChange={(e) => setProductAdjustment(product.id, Math.max(0, Number(e.target.value)))}
                                className="w-16 border-none bg-transparent text-center text-sm outline-none"
                                min={0}
                                step={adjustmentMode === "fixed" ? 0.01 : 1}
                              />
                              {adjustmentMode === "dynamic" && <span>%</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(newPrice)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                Select products above to see the price table.
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Your entries are saved automatically</p>
              <div className="flex items-center gap-3">
                <Button variant="ghost">Back</Button>
                <Button className="bg-foboh text-white hover:bg-foboh/90">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Step 3: Assign Customers ── */}
        <Card>
          <CardContent className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-lg font-semibold">Assign Customers to Pricing Profile</h2>
              <p className="text-sm text-muted-foreground">
                Choose which customers this profile will be applied to
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Not Started</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
