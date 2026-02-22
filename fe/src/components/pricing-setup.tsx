"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUp,
  Search,
  HelpCircle,
  Settings,
  Pencil,
  RefreshCw,
  Info,
  X,
  Users,
  Lightbulb,
  RotateCcw,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Product, Customer, CalculatedPrice } from "@/data/constants";
import { BASED_ON_PROFILES } from "@/data/constants";
import { toast } from "sonner";
import {
  fetchProducts,
  fetchCustomers,
  fetchSegments,
  fetchBrands,
  calculatePrices,
  createPricingProfile,
} from "@/lib/fetchers";

// ── Schema ──

const pricingFormSchema = z.object({
  selectionType: z.enum(["one", "multiple", "all"]),
  selectedProductIds: z.array(z.string()).min(1, "Select at least one product"),
  basedOn: z.string().min(1, "Select a base pricing profile"),
  adjustmentMode: z.enum(["fixed", "dynamic"]),
  incrementMode: z.enum(["increase", "decrease"]),
  adjustments: z.record(z.string(), z.number().min(0, "Must be 0 or greater")),
  selectedCustomerIds: z
    .array(z.string())
    .min(1, "Select at least one customer"),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

type WizardStep = 2 | 3 | "review";

const BRAND_COLORS: Record<string, string> = {
  "High Garden": "bg-amber-800",
  "Koyama Wines": "bg-indigo-700",
  "Lacourte-Godbillon": "bg-rose-800",
};

const DEFAULT_ADJUSTMENT = 5;

// ── Helpers ──

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

// ── Component ──

export function PricingSetup() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(2);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      selectionType: "multiple",
      selectedProductIds: [],
      basedOn: "global",
      adjustmentMode: "fixed",
      incrementMode: "decrease",
      adjustments: {},
      selectedCustomerIds: [],
    },
  });

  // Non-form filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [skuFilter, setSkuFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Debounced values for server-side search
  const debouncedSearch = useDebouncedValue(searchQuery);
  const debouncedSku = useDebouncedValue(skuFilter);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch);

  // Data from backend
  const productsQuery = useQuery({
    queryKey: [
      "products",
      debouncedSearch,
      debouncedSku,
      categoryFilter,
      segmentFilter,
      brandFilter,
    ],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch,
        sku: debouncedSku,
        category: categoryFilter,
        segment: segmentFilter,
        brand: brandFilter,
      }),
  });
  const customersQuery = useQuery({
    queryKey: ["customers", debouncedCustomerSearch],
    queryFn: () => fetchCustomers(debouncedCustomerSearch),
  });
  const segmentsQuery = useQuery({
    queryKey: ["segments"],
    queryFn: fetchSegments,
  });
  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  const [calculatedPrices, setCalculatedPrices] = useState<
    Map<string, CalculatedPrice>
  >(new Map());

  const priceMutation = useMutation({
    mutationFn: calculatePrices,
    onSuccess: (data) => {
      const map = new Map<string, CalculatedPrice>();
      for (const item of data) {
        map.set(item.productId, item);
      }
      setCalculatedPrices(map);
    },
  });

  const publishMutation = useMutation({
    mutationFn: createPricingProfile,
    onSuccess: () => toast.success("Saved pricing profile"),
  });

  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const segments = segmentsQuery.data ?? [];
  const brands = brandsQuery.data ?? [];
  // Sub-categories: static until backend provides a dedicated endpoint
  const subCategories = [
    "Wine",
    "Beer",
    "Liquor & Spirits",
    "Cider",
    "Premixed & Ready-to-Drink",
    "Other",
  ];

  // Watch form values
  const selectionType = form.watch("selectionType");
  const selectedIds = form.watch("selectedProductIds");
  const basedOn = form.watch("basedOn");
  const adjustmentMode = form.watch("adjustmentMode");
  const incrementMode = form.watch("incrementMode");
  const adjustments = form.watch("adjustments");
  const selectedCustomerIds = form.watch("selectedCustomerIds");

  // Products are already filtered server-side via query params
  const filteredProducts = products;

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (categoryFilter)
    activeFilters.push({
      label: categoryFilter,
      clear: () => setCategoryFilter(""),
    });
  if (segmentFilter)
    activeFilters.push({
      label: segmentFilter,
      clear: () => setSegmentFilter(""),
    });
  if (brandFilter)
    activeFilters.push({ label: brandFilter, clear: () => setBrandFilter("") });

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const basedOnProfile = BASED_ON_PROFILES.find((p) => p.id === basedOn);
  const basedOnLabel = basedOnProfile?.name ?? "Global Wholesale Price";

  // Customers are already filtered server-side via query params
  const filteredCustomers = customers;

  const selectedCustomers = customers.filter((c) =>
    selectedCustomerIds.includes(c.id),
  );

  // ── Handlers: products ──

  function toggleProduct(id: string) {
    const current = form.getValues("selectedProductIds");
    let next: string[];
    if (selectionType === "one") {
      next = current.includes(id) ? [] : [id];
    } else {
      next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
    }
    form.setValue("selectedProductIds", next, { shouldValidate: true });
  }

  function selectAllProducts() {
    form.setValue(
      "selectedProductIds",
      filteredProducts.map((p) => p.id),
      { shouldValidate: true },
    );
  }

  function deselectAllProducts() {
    form.setValue("selectedProductIds", [], { shouldValidate: true });
  }

  function handleSelectionTypeChange(
    value: PricingFormValues["selectionType"],
  ) {
    form.setValue("selectionType", value);
    if (value === "all") {
      form.setValue(
        "selectedProductIds",
        products.map((p) => p.id),
        { shouldValidate: true },
      );
    } else {
      form.setValue("selectedProductIds", [], { shouldValidate: true });
    }
  }

  function getAdjustment(productId: string): number {
    return adjustments[productId] ?? DEFAULT_ADJUSTMENT;
  }

  function setProductAdjustment(productId: string, value: number) {
    const current = form.getValues("adjustments");
    form.setValue("adjustments", {
      ...current,
      [productId]: Math.max(0, value),
    });
  }

  function getBasedOnPrice(product: Product): number {
    return product.globalWholesalePrice;
  }

  function refreshPriceTable() {
    const ids = form.getValues("selectedProductIds");
    if (ids.length === 0) return;

    const currentAdjustments: Record<string, number> = {};
    for (const id of ids) {
      currentAdjustments[id] = getAdjustment(id);
    }

    priceMutation.mutate({
      productIds: ids,
      adjustmentMode: form.getValues("adjustmentMode"),
      incrementMode: form.getValues("incrementMode"),
      adjustments: currentAdjustments,
    });
  }

  // Auto-recalculate prices when inputs change (debounced)
  const adjustmentsJson = JSON.stringify(adjustments);
  const debouncedAdjustments = useDebouncedValue(adjustmentsJson);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setCalculatedPrices(new Map());
      return;
    }

    const currentAdjustments: Record<string, number> = {};
    for (const id of selectedIds) {
      currentAdjustments[id] = adjustments[id] ?? DEFAULT_ADJUSTMENT;
    }

    priceMutation.mutate({
      productIds: selectedIds,
      adjustmentMode,
      incrementMode,
      adjustments: currentAdjustments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, adjustmentMode, incrementMode, debouncedAdjustments]);

  // ── Handlers: customers ──

  function toggleCustomer(id: string) {
    const current = form.getValues("selectedCustomerIds");
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    form.setValue("selectedCustomerIds", next, { shouldValidate: true });
  }

  function selectAllCustomers() {
    form.setValue(
      "selectedCustomerIds",
      filteredCustomers.map((c) => c.id),
      { shouldValidate: true },
    );
  }

  function deselectAllCustomers() {
    form.setValue("selectedCustomerIds", [], { shouldValidate: true });
  }

  // ── Step navigation ──

  async function advanceFromStepTwo() {
    const valid = await form.trigger([
      "selectionType",
      "selectedProductIds",
      "basedOn",
      "adjustmentMode",
      "incrementMode",
    ]);
    if (!valid) return;

    // Enrich adjustments with defaults
    const enriched: Record<string, number> = {};
    for (const id of form.getValues("selectedProductIds")) {
      enriched[id] = form.getValues("adjustments")[id] ?? DEFAULT_ADJUSTMENT;
    }
    form.setValue("adjustments", enriched);
    setCurrentStep(3);
  }

  async function advanceFromStepThree() {
    const valid = await form.trigger(["selectedCustomerIds"]);
    if (valid) setCurrentStep("review");
  }

  function onPublish(data: PricingFormValues) {
    publishMutation.mutate(data);
  }

  // ── Summary helpers ──

  function adjustmentSummaryText(): string {
    const modeLabel = adjustmentMode === "fixed" ? "Fixed" : "Dynamic";
    const dirLabel = incrementMode === "increase" ? "Increase" : "Decrease";
    const adj =
      selectedProducts.length > 0
        ? getAdjustment(selectedProducts[0].id)
        : DEFAULT_ADJUSTMENT;
    const valDisplay = adjustmentMode === "fixed" ? `$${adj}` : `${adj}%`;
    return `${modeLabel} ${dirLabel} of ${valDisplay}`;
  }

  const today = new Date();

  // ── Render ──

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-100 flex items-center justify-between bg-foboh px-6 py-6 text-white">
        <div>
          <p className="text-base font-medium">Hello, Ekemini</p>
          <p className="text-xs text-white/80">
            {today.toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="default" className="rounded-full bg-white/20 p-2">
            <HelpCircle className="size-4" />
          </Button>
          <Button variant="default" className="rounded-full bg-white/20 p-2">
            <Settings className="size-4" />
          </Button>
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

      <main className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onPublish)}>
            <div className="rounded-xl p-6 bg-muted">
              {/* Breadcrumb */}
              <div className="mb-6 flex items-start justify-between">
                <div className="space-y-2">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="text-base">
                        <BreadcrumbLink href="#">
                          Pricing Profile
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem className="text-base">
                        <BreadcrumbPage className="font-medium">
                          Setup a Profile
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Setup your pricing profile, select products and assign
                    customers
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button variant="outline" size="sm">
                    Save as Draft
                  </Button>
                </div>
              </div>
              {/* ══ Step 1: Basic Pricing Profile (always completed) ══ */}
              <Card className="mb-4">
                <CardHeader className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg font-medium">
                      Basic Pricing Profile
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Cheeky little description goes in here
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-emerald-600">
                      Completed
                    </span>
                  </div>
                </CardHeader>
                <div className="px-6">
                  <Separator />
                </div>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        You&apos;ve created a Price Profile
                      </p>
                      <p className="text-base font-medium">Heaps Normal #4</p>
                      <p className="text-sm text-muted-foreground">
                        Marked as{" "}
                        <span className="font-medium text-foreground">
                          Default
                        </span>
                        , and expires in{" "}
                        <span className="font-medium text-foreground">
                          18 Days
                        </span>{" "}
                        (Date Here)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      type="button"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                      Make Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ══ Step 2: Set Product Pricing ══ */}
              {currentStep === 2 ? (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">
                      Set Product Pricing
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Set details
                    </CardDescription>
                  </CardHeader>
                  <div className="px-6">
                    <Separator />
                  </div>
                  <CardContent>
                    {/* Selection type */}
                    <FormField
                      control={form.control}
                      name="selectionType"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-sm">
                            You are creating a Pricing Profile for
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(v) =>
                                handleSelectionTypeChange(
                                  v as PricingFormValues["selectionType"],
                                )
                              }
                              className="flex gap-6"
                            >
                              {(
                                [
                                  ["one", "One Product"],
                                  ["multiple", "Multiple Products"],
                                  ["all", "All Products"],
                                ] as const
                              ).map(([value, label]) => (
                                <div
                                  key={value}
                                  className="flex items-center gap-2"
                                >
                                  <RadioGroupItem
                                    value={value}
                                    id={`sel-${value}`}
                                  />
                                  <label
                                    htmlFor={`sel-${value}`}
                                    className="cursor-pointer text-sm"
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Search & filters */}
                    {selectionType !== "all" && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium">
                          Search for Products
                        </p>
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
                          <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {subCategories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={segmentFilter}
                            onValueChange={setSegmentFilter}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Segment" />
                            </SelectTrigger>
                            <SelectContent>
                              {segments.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={brandFilter}
                            onValueChange={setBrandFilter}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Result count + chips */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                      <span>
                        Showing{" "}
                        <span className="font-medium">
                          ({filteredProducts.length} Result
                          {filteredProducts.length !== 1 ? "s" : ""})
                        </span>
                        {(searchQuery || skuFilter) && (
                          <>
                            {" "}
                            for{" "}
                            <span className="font-medium">
                              {searchQuery || skuFilter}
                            </span>
                          </>
                        )}
                      </span>
                      {activeFilters.map((f) => (
                        <Badge
                          key={f.label}
                          variant="secondary"
                          className="gap-1 pl-2 pr-1"
                        >
                          {f.label}
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={f.clear}
                            className="rounded-full p-0.5 hover:bg-muted has-[>svg]:px-1 h-2"
                          >
                            <X className="size-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>

                    {/* Select / deselect all */}
                    {selectionType !== "one" && (
                      <div className="mb-3 flex items-center gap-4 text-sm">
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={deselectAllProducts}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground has-[>svg]:px-1 px-2"
                        >
                          <span className="flex size-4 items-center justify-center rounded-full border">
                            <X className="size-2.5" />
                          </span>
                          Deselect All
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={selectAllProducts}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground has-[>svg]:px-1 px-2"
                        >
                          <span className="flex size-4 items-center justify-center rounded-full border">
                            <span className="size-2 rounded-full bg-current" />
                          </span>
                          Select all
                        </Button>
                      </div>
                    )}

                    {/* Product list */}
                    {productsQuery.isLoading && (
                      <div className="space-y-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-2 py-2"
                          >
                            <Skeleton className="size-4 rounded" />
                            <Skeleton className="size-10 rounded" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3.5 w-36" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {productsQuery.isError && (
                      <div className="py-8 text-center">
                        <p className="text-sm text-destructive">
                          Failed to load products.
                        </p>
                        <Button
                          size="sm"
                          type="button"
                          variant="link"
                          onClick={() => productsQuery.refetch()}
                          className="mt-2 text-sm text-foboh hover:underline"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {productsQuery.isSuccess && (
                      <FormField
                        control={form.control}
                        name="selectedProductIds"
                        render={() => (
                          <FormItem className="mb-4">
                            <div className="space-y-1">
                              {filteredProducts.map((product) => {
                                const isSelected = selectedIds.includes(
                                  product.id,
                                );
                                const color =
                                  BRAND_COLORS[product.brand] ?? "bg-gray-500";
                                return (
                                  <label
                                    key={product.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        toggleProduct(product.id)
                                      }
                                    />
                                    <div
                                      className={`flex size-10 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${color}`}
                                    >
                                      {product.title.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium leading-tight">
                                        {product.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        SKU {product.skuCode} &middot;{" "}
                                        {product.subCategoryId} &middot;{" "}
                                        {product.segmentId}
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedProducts.length > 0 && (
                      <p className="mb-4 text-sm text-muted-foreground">
                        You&apos;ve selected{" "}
                        <span className="font-medium text-foreground">
                          {selectedProducts.length} Product
                          {selectedProducts.length !== 1 ? "s" : ""}
                        </span>
                        , these will be added{" "}
                        <span className="font-medium text-foreground">
                          (Heaps Normal #4)
                        </span>
                      </p>
                    )}

                    <Separator className="my-6" />

                    {/* Based on */}
                    <FormField
                      control={form.control}
                      name="basedOn"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Based on
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BASED_ON_PROFILES.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Adjustment mode */}
                    <FormField
                      control={form.control}
                      name="adjustmentMode"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Set Price Adjustment Mode
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-6"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="fixed" id="adj-fixed" />
                                <label
                                  htmlFor="adj-fixed"
                                  className="cursor-pointer text-sm"
                                >
                                  Fixed ($)
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="dynamic"
                                  id="adj-dynamic"
                                />
                                <label
                                  htmlFor="adj-dynamic"
                                  className="cursor-pointer text-sm"
                                >
                                  Dynamic (%)
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Increment mode */}
                    <FormField
                      control={form.control}
                      name="incrementMode"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Set Price Adjustment Increment Mode
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-6"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="increase"
                                  id="inc-increase"
                                />
                                <label
                                  htmlFor="inc-increase"
                                  className="cursor-pointer text-sm"
                                >
                                  Increase +
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="decrease"
                                  id="inc-decrease"
                                />
                                <label
                                  htmlFor="inc-decrease"
                                  className="cursor-pointer text-sm"
                                >
                                  Decrease -
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Info notice */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-foboh-brown">
                      <Lightbulb className="size-4 shrink-0 text-foboh-brown" />
                      <span>
                        The adjusted price will be calculated from{" "}
                        <span className="font-medium text-foreground">
                          {basedOnLabel}
                        </span>{" "}
                        selected above
                      </span>
                    </div>

                    {/* Refresh */}
                    <div className="mb-3 flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="flex items-center gap-1.5 text-sm text-foboh-purple hover:underline"
                        onClick={refreshPriceTable}
                        disabled={
                          priceMutation.isPending ||
                          selectedProducts.length === 0
                        }
                      >
                        {priceMutation.isPending
                          ? "Calculating..."
                          : "Refresh New Price Table"}
                        <RotateCcw
                          className={`size-3.5 ${priceMutation.isPending ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>

                    {/* Price table */}
                    {selectedProducts.length > 0 ? (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8">
                                <Checkbox
                                  checked={
                                    selectedProducts.length ===
                                      filteredProducts.length &&
                                    filteredProducts.length > 0
                                  }
                                  onCheckedChange={(c) =>
                                    c
                                      ? selectAllProducts()
                                      : deselectAllProducts()
                                  }
                                />
                              </TableHead>
                              <TableHead>Product Title</TableHead>
                              <TableHead>SKU Code</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">
                                {basedOnLabel}
                              </TableHead>
                              <TableHead className="text-center">
                                Adjustment
                              </TableHead>
                              <TableHead className="text-right">
                                New Price
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProducts.map((product) => {
                              const calculated = calculatedPrices.get(
                                product.id,
                              );
                              const basedOnPrice =
                                calculated?.basedOnPrice ??
                                getBasedOnPrice(product);
                              const adj = getAdjustment(product.id);
                              const sign =
                                incrementMode === "decrease" ? "-" : "+";
                              return (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedIds.includes(product.id)}
                                      onCheckedChange={() =>
                                        toggleProduct(product.id)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {product.title}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {product.skuCode}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {product.subCategoryId}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(basedOnPrice)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="inline-flex items-center gap-1 rounded bg-foboh/10 px-3 py-1.5 text-sm text-foboh">
                                      <span>
                                        {sign}
                                        {adjustmentMode === "fixed" ? "$ " : ""}
                                      </span>
                                      <input
                                        type="number"
                                        value={adj}
                                        onChange={(e) =>
                                          setProductAdjustment(
                                            product.id,
                                            Number(e.target.value),
                                          )
                                        }
                                        className="w-16 border-none bg-transparent text-center text-sm outline-none"
                                        min={0}
                                        step={
                                          adjustmentMode === "fixed" ? 0.01 : 1
                                        }
                                      />
                                      {adjustmentMode === "dynamic" && (
                                        <span>%</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {calculated
                                      ? formatCurrency(calculated.newPrice)
                                      : "—"}
                                  </TableCell>
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

                    {/* Step 2 footer */}
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Your entries are saved automatically
                      </p>
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="ghost">
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="bg-foboh text-white hover:bg-foboh/90"
                          onClick={advanceFromStepTwo}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Step 2 collapsed summary */
                <Card className="mb-4">
                  <CardHeader className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium">
                        Set Product Pricing
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Cheeky little description goes in here
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full bg-emerald-500" />
                      <span className="font-medium text-emerald-600">
                        Completed
                      </span>
                    </div>
                  </CardHeader>
                  <div className="px-6">
                    <Separator />
                  </div>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-4">
                          {selectedProducts.slice(0, 3).map((product) => {
                            const color =
                              BRAND_COLORS[product.brand] ?? "bg-gray-500";
                            return (
                              <div
                                key={product.id}
                                className={`flex size-12 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${color}`}
                              >
                                {product.title.slice(0, 2).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            You&apos;ve selected{" "}
                            <span className="font-medium text-foreground">
                              {selectedProducts.length} Product
                              {selectedProducts.length !== 1 ? "s" : ""}
                            </span>
                          </p>
                          <p className="text-sm font-medium">
                            {selectedProducts.length > 1
                              ? selectedProducts
                                  .slice(0, 3)
                                  .map((p) => p.title.split(" ")[0])
                                  .join(" & ")
                              : selectedProducts[0].title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            With Price Adjustment Mode set to{" "}
                            <span className="font-medium text-foreground">
                              {adjustmentSummaryText()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                        Make Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ══ Step 3: Assign Customers ══ */}
              {currentStep === 2 ? (
                /* Not started placeholder */
                <Card>
                  <CardHeader className="flex justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium">
                        Assign Customers to Pricing Profile
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Choose which customers this profile will be applied to
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">Not Started</span>
                    </div>
                  </CardHeader>
                </Card>
              ) : currentStep === 3 ? (
                /* Active customer assignment */
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">
                      Assign Customers to Pricing Profile
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Choose which customers this profile will be applied to
                    </CardDescription>
                  </CardHeader>
                  <div className="px-6">
                    <Separator />
                  </div>
                  <CardContent>
                    {/* Customer search */}
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium">
                        Search for Customers
                      </p>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or business"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-72 pl-9"
                        />
                      </div>
                    </div>

                    {/* Select / deselect all */}
                    <div className="mb-3 flex items-center gap-4 text-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={deselectAllCustomers}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground has-[>svg]:px-1 px-2"
                      >
                        <span className="flex size-4 items-center justify-center rounded-full border">
                          <X className="size-2.5" />
                        </span>
                        Deselect All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={selectAllCustomers}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground has-[>svg]:px-1 px-2"
                      >
                        <span className="flex size-4 items-center justify-center rounded-full border">
                          <span className="size-2 rounded-full bg-current" />
                        </span>
                        Select all
                      </Button>
                    </div>

                    {/* Customer list */}
                    {customersQuery.isLoading && (
                      <div className="space-y-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-2 py-2"
                          >
                            <Skeleton className="size-4 rounded" />
                            <Skeleton className="size-10 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3.5 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {customersQuery.isError && (
                      <div className="py-8 text-center">
                        <p className="text-sm text-destructive">
                          Failed to load customers.
                        </p>
                        <button
                          type="button"
                          onClick={() => customersQuery.refetch()}
                          className="mt-2 text-sm text-foboh hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {customersQuery.isSuccess && (
                      <FormField
                        control={form.control}
                        name="selectedCustomerIds"
                        render={() => (
                          <FormItem className="mb-4">
                            <div className="space-y-1">
                              {filteredCustomers.map((customer) => {
                                const isSelected = selectedCustomerIds.includes(
                                  customer.id,
                                );
                                return (
                                  <label
                                    key={customer.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        toggleCustomer(customer.id)
                                      }
                                    />
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                      {customer.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium leading-tight">
                                        {customer.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {customer.business}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                              {filteredCustomers.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                  No customers match your search.
                                </p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedCustomers.length > 0 && (
                      <p className="mb-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {selectedCustomers.length} customer
                          {selectedCustomers.length !== 1 ? "s" : ""}
                        </span>{" "}
                        will receive this pricing profile
                      </p>
                    )}

                    {/* Step 3 footer */}
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Your entries are saved automatically
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCurrentStep(2)}
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="bg-foboh text-white hover:bg-foboh/90"
                          onClick={advanceFromStepThree}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Step 3 collapsed summary (review state) */
                <Card className="mb-4 py-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-medium">
                          Assign Customers to Pricing Profile
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Choose which customers this profile will be applied to
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="font-medium text-emerald-600">
                          Completed
                        </span>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gray-200">
                          <Users className="size-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedCustomers.length} customer
                            {selectedCustomers.length !== 1 ? "s" : ""} assigned
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedCustomers
                              .slice(0, 3)
                              .map((c) => c.business)
                              .join(", ")}
                            {selectedCustomers.length > 3 &&
                              ` +${selectedCustomers.length - 3} more`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                        Make Changes
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            {/* ══ Review footer ══ */}
            {currentStep === "review" && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Your entries are saved automatically
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-foboh text-white hover:bg-foboh/90"
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending
                      ? "Publishing..."
                      : "Save & Publish Profile"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </main>

      {/* Scroll to top */}
      <Button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed cursor-pointer bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-black/90"
      >
        <ArrowUp className="size-5" />
      </Button>
    </div>
  );
}
