import { Box, Typography, Stack, TextField, Button } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { CATEGORIES, REGIONS, CONDITIONS } from "../utils/constants";

// The search API takes a single value per filter (category/region/condition),
// so each group is single-select: clicking the active option clears it.
function OptionList({ title, options, value, onSelect, first = false }) {
  return (
    <Box sx={{ pt: first ? 0 : 2, pb: 2, borderBottom: 1, borderColor: "divider" }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      <Stack spacing={1}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Box
              key={opt}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(selected ? "" : opt)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(selected ? "" : opt);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
                cursor: "pointer",
                fontSize: 13,
                color: selected ? "#1a1a1a" : "#4d4d4d",
                fontWeight: selected ? 600 : 400,
                "&:focus-visible": { outline: "2px solid #1a1a1a", outlineOffset: 2 },
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: selected ? "#1a1a1a" : "transparent",
                  border: selected ? "none" : "1px solid #cfcfcf",
                  boxSizing: "border-box",
                }}
              >
                {selected && <CheckIcon sx={{ fontSize: 12, color: "#fff" }} />}
              </Box>
              {opt}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function FilterSidebar({ filters, onChange, onClear }) {
  return (
    <Box sx={{ width: { xs: "100%", md: 248 }, flex: "none" }}>
      <OptionList
        title="Category"
        options={CATEGORIES}
        value={filters.category}
        onSelect={(v) => onChange("category", v)}
        first
      />
      <OptionList
        title="Region"
        options={REGIONS}
        value={filters.region}
        onSelect={(v) => onChange("region", v)}
      />

      <Box sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Price range</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            placeholder="$0"
            value={filters.minPrice}
            onChange={(e) => onChange("minPrice", e.target.value)}
            inputProps={{ min: 0, "aria-label": "Minimum price" }}
          />
          <Typography color="text.secondary">–</Typography>
          <TextField
            size="small"
            type="number"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => onChange("maxPrice", e.target.value)}
            inputProps={{ min: 0, "aria-label": "Maximum price" }}
          />
        </Stack>
      </Box>

      <OptionList
        title="Condition"
        options={CONDITIONS}
        value={filters.condition}
        onSelect={(v) => onChange("condition", v)}
      />

      <Box sx={{ pt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClear}
          sx={{ textTransform: "none", color: "#1a1a1a", borderColor: "#cfcfcf" }}
        >
          Clear all filters
        </Button>
      </Box>
    </Box>
  );
}
