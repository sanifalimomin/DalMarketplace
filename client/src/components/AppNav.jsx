import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  InputBase,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initials } from "../utils/format";

// Shared top navigation. Pass `active` ("browse" | "my-listings") to highlight the
// current section. Pass `onSearchChange` for a controlled search box (browse page);
// otherwise the box is self-managed and submits to /dashboard?q=… on Enter.
export default function AppNav({ active, search, onSearchChange }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const [localSearch, setLocalSearch] = useState("");

  const controlled = typeof onSearchChange === "function";
  const searchValue = controlled ? search ?? "" : localSearch;

  function handleSearchChange(e) {
    if (controlled) onSearchChange(e.target.value);
    else setLocalSearch(e.target.value);
  }

  function handleSearchKey(e) {
    if (!controlled && e.key === "Enter" && localSearch.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(localSearch.trim())}`);
    }
  }

  const linkSx = (key) => ({
    textTransform: "none",
    color: active === key ? "#1a1a1a" : "#4d4d4d",
    fontWeight: active === key ? 600 : 400,
  });

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: "#fff", color: "#1a1a1a", borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              bgcolor: "#1a1a1a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            DM
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 17, display: { xs: "none", sm: "block" } }}>
            DalMarketplace
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            height: 40,
            flex: 1,
            maxWidth: 460,
            bgcolor: "#fafafa",
            border: 1,
            borderColor: "#cfcfcf",
            borderRadius: 999,
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "#808080" }} />
          <InputBase
            fullWidth
            placeholder="Search desks, monitors, sublets…"
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKey}
            inputProps={{ "aria-label": "Search listings" }}
            sx={{ fontSize: 14 }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
          <Button onClick={() => navigate("/help")} sx={linkSx("help")}>
            Help
          </Button>
          <Button onClick={() => navigate("/dashboard")} sx={linkSx("browse")}>
            Browse
          </Button>
          <Button onClick={() => navigate("/messages")} sx={linkSx("messages")}>
            Messages
          </Button>
          <Button onClick={() => navigate("/my-listings")} sx={linkSx("my-listings")}>
            My Listings
          </Button>
          <Button onClick={() => navigate("/purchases")} sx={linkSx("my-purchases")}>
            My Purchases
          </Button>
        </Stack>

        <Button
          variant="contained"
          onClick={() => navigate("/listings/new")}
          sx={{ textTransform: "none", bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" }, ml: 1 }}
        >
          + Post item
        </Button>

        <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0.5 }} aria-label="Account menu">
          <Avatar
            src={user?.avatarUrl || undefined}
            sx={{ width: 34, height: 34, fontSize: 13, bgcolor: "#f2f2f2", color: "#4d4d4d" }}
          >
            {initials(user?.name)}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          {user?.name && <MenuItem disabled>{user.name}</MenuItem>}
          <MenuItem
            onClick={() => {
              setAnchor(null);
              navigate("/profile");
            }}
          >
            Profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              navigate("/my-listings");
            }}
          >
            My Listings
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchor(null);
              logout();
            }}
          >
            Log out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
