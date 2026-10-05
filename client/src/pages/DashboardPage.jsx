import { useEffect, useState } from "react";
import {
  API_BASE,
  dangerButtonClass,
  defaultCategories,
  eyebrowClass,
  foodTypeConfigs,
  ghostButtonClass,
  inputClass,
  panelClass,
  primaryButtonClass,
  shellClass,
  socialPlatformConfigs,
} from "../config/appConfig";
import SocialIcon from "../components/SocialIcon";
import { Field, FoodTypeIcon, NoticeBox, StatusScreen } from "../components/ui";
import {
  createEditDraft,
  createMenuDraft,
  getMenuCategories,
  getFoodTypeConfig,
  getSocialPlatformConfigByLabel,
  groupMenuItemsByCategory,
  hydrateSocialLinks,
  serializeSocialLinks,
  slugifyCategory,
} from "../utils/menu";
import { parseApiResponse } from "../utils/session";

function DashboardPage({ session, onAuthRefresh, onLogout, onToast }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const [editMenuSaving, setEditMenuSaving] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [fileInputSeed, setFileInputSeed] = useState(0);
  const groupedDashboardItems = groupMenuItemsByCategory(dashboard?.menuItems || []);
  const ownerCategories = Array.from(
    new Set([...defaultCategories, ...getMenuCategories(dashboard?.menuItems || [])]),
  );
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessType: "food-cart",
    phone: "",
    address: "",
    description: "",
    socialLinks: [],
  });
  const [menuDrafts, setMenuDrafts] = useState([createMenuDraft()]);

  useEffect(() => {
    loadDashboard();
  }, [session.token]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard.");
      }

      if (!data.owner) {
        throw new Error("Dashboard response is missing owner details.");
      }

      setDashboard(data);
      setProfileForm({
        businessName: data.owner.businessName || "",
        businessType: data.owner.businessType || "food-cart",
        phone: data.owner.phone || "",
        address: data.owner.address || "",
        description: data.owner.description || "",
        socialLinks: hydrateSocialLinks(data.owner.socialLinks),
      });
      onAuthRefresh({ token: session.token, owner: data.owner });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateProfileField(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function updateSocialLink(index, field, value) {
    setProfileForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ...profileForm,
          socialLinks: serializeSocialLinks(profileForm.socialLinks),
        }),
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile.");
      }

      onAuthRefresh({ token: session.token, owner: data.owner });
      setNotice("Dashboard profile updated.");
      onToast("Business profile updated.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setProfileSaving(false);
    }
  }

  function addMenuDraft() {
    setMenuDrafts((current) => [...current, createMenuDraft()]);
  }

  function removeMenuDraft(draftId) {
    setMenuDrafts((current) =>
      current.length === 1
        ? current
        : current.filter((draft) => draft.id !== draftId),
    );
  }

  function updateMenuDraft(draftId, field, value) {
    setMenuDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId ? { ...draft, [field]: value } : draft,
      ),
    );
  }

  async function handleMenuSubmit(event) {
    event.preventDefault();
    setMenuSaving(true);
    setNotice("");
    setError("");

    try {
      const validDrafts = menuDrafts.filter(
        (draft) =>
          String(draft.name).trim() ||
          String(draft.price).trim() ||
          draft.image,
      );

      if (validDrafts.length === 0) {
        throw new Error("Add at least one menu item before uploading.");
      }

      const formData = new FormData();
      const itemsPayload = validDrafts.map((draft, index) => {
        if (
          !String(draft.name).trim() ||
          !String(draft.price).trim() ||
          !draft.image
        ) {
          throw new Error(
            "Each menu item must include a name, price, and image.",
          );
        }

        formData.append("images", draft.image);

        return {
          name: draft.name,
          category: draft.category,
          foodType: draft.foodType,
          description: draft.description,
          price: draft.price,
          available: draft.available,
          imageIndex: index,
        };
      });

      formData.append("items", JSON.stringify(itemsPayload));

      const response = await fetch(`${API_BASE}/dashboard/menu-items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to create menu items.");
      }

      setMenuDrafts([createMenuDraft()]);
      setFileInputSeed((current) => current + 1);
      setNotice(
        `${data.items?.length || validDrafts.length} menu item${
          (data.items?.length || validDrafts.length) > 1 ? "s" : ""
        } uploaded.`,
      );
      onToast(
        `${data.items?.length || validDrafts.length} menu item${
          (data.items?.length || validDrafts.length) > 1 ? "s" : ""
        } uploaded successfully.`,
      );
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setMenuSaving(false);
    }
  }

  async function deleteMenuItem(itemId) {
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/dashboard/menu-items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await parseApiResponse(response);
        throw new Error(data.message || "Unable to delete menu item.");
      }

      setNotice("Menu item deleted.");
      onToast("Menu item deleted.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    }
  }

  function startEditingMenuItem(item) {
    setEditingItemId(item.id);
    setEditDraft(createEditDraft(item));
    setNotice("");
    setError("");
  }

  function cancelEditingMenuItem() {
    setEditingItemId("");
    setEditDraft(null);
  }

  function updateEditDraft(field, value) {
    setEditDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveEditedMenuItem(itemId) {
    if (!editDraft) {
      return;
    }

    setEditMenuSaving(true);
    setNotice("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", editDraft.name);
      formData.append("category", editDraft.category);
      formData.append("foodType", editDraft.foodType);
      formData.append("description", editDraft.description);
      formData.append("price", editDraft.price);
      formData.append("available", String(editDraft.available));

      if (editDraft.image) {
        formData.append("image", editDraft.image);
      }

      const response = await fetch(`${API_BASE}/dashboard/menu-items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });
      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to update menu item.");
      }

      setNotice("Menu item updated.");
      onToast("Menu item updated.");
      cancelEditingMenuItem();
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setEditMenuSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete this owner account and all menu items permanently?",
    );

    if (!confirmed) {
      return;
    }

    setAccountDeleting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/dashboard/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      if (!response.ok) {
        const data = await parseApiResponse(response);
        throw new Error(data.message || "Unable to delete account.");
      }

      onToast("Account deleted successfully.");
      onLogout();
    } catch (requestError) {
      setError(requestError.message);
      onToast(requestError.message, "error");
    } finally {
      setAccountDeleting(false);
    }
  }

  function handleLogoutClick() {
    onToast("Logged out successfully.");
    onLogout();
  }

  if (loading) {
    return <StatusScreen>Loading dashboard...</StatusScreen>;
  }

  if (!dashboard) {
    return (
      <StatusScreen error>{error || "Dashboard unavailable."}</StatusScreen>
    );
  }

  return (
    <div className={`${shellClass} overflow-x-hidden`}>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="wrap-break-word text-3xl font-black text-[#20120e] sm:text-4xl">
            {dashboard.owner.businessName}
          </h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <a
            className={`${ghostButtonClass} w-full sm:w-auto`}
            href={dashboard.publicMenuUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Public Menu
          </a>
          <button
            className={`${dangerButtonClass} w-full sm:w-auto`}
            type="button"
            onClick={handleLogoutClick}
          >
            Logout
          </button>
        </div>
      </header>

      {error ? <NoticeBox tone="error">{error}</NoticeBox> : null}
      {notice ? <NoticeBox tone="success">{notice}</NoticeBox> : null}

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-5">
          <p className={eyebrowClass}>Customer Scans</p>
          <p className="text-3xl font-black text-[#20120e]">
            {dashboard.owner.scanCount || 0}
          </p>
        </article>
        <article className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-5">
          <p className={eyebrowClass}>Social Clicks</p>
          <p className="text-3xl font-black text-[#20120e]">
            {(dashboard.owner.socialLinks || []).reduce(
              (total, link) => total + (link.clickCount || 0),
              0,
            )}
          </p>
        </article>
        <article className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-5">
          <p className={eyebrowClass}>Google Review Clicks</p>
          <p className="text-3xl font-black text-[#20120e]">
            {dashboard.owner.socialLinks?.find(
              (link) => link.platform === "Google Reviews",
            )?.clickCount || 0}
          </p>
        </article>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className={panelClass}>
          <div className="mb-5">
            <p className={eyebrowClass}>Business Profile</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Store details and review section links
            </h2>
          </div>

          <form className="grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <input
                  className={inputClass}
                  name="businessName"
                  value={profileForm.businessName}
                  onChange={updateProfileField}
                  required
                />
              </Field>

              <Field label="Business type">
                <select
                  className={inputClass}
                  name="businessType"
                  value={profileForm.businessType}
                  onChange={updateProfileField}
                >
                  <option value="food-cart">Food Cart</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Phone">
                <input
                  className={inputClass}
                  name="phone"
                  value={profileForm.phone}
                  onChange={updateProfileField}
                />
              </Field>

              <Field label="Address">
                <textarea
                  className={inputClass}
                  name="address"
                  rows="3"
                  value={profileForm.address}
                  onChange={updateProfileField}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={inputClass}
                name="description"
                rows="4"
                value={profileForm.description}
                onChange={updateProfileField}
              />
            </Field>

            <div className="grid gap-4">
              <div>
                <p className={eyebrowClass}>Review</p>
                <h3 className="text-xl font-bold text-[#20120e]">
                  Social handles and rating links
                </h3>
                <p className="mt-2 text-sm text-[#746157]">
                  Add URLs only for the handles you use. Empty handles stay hidden for users.
                </p>
              </div>

              {profileForm.socialLinks.map((link, index) => (
                <label
                  className="grid gap-3 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/70 p-4 xl:grid-cols-[auto_12rem_1fr]"
                  key={link.localId}
                >
                  <div className="flex items-center justify-center xl:justify-start">
                    <SocialIcon platform={link.platform} url={link.url} />
                  </div>
                  <div className="grid content-center gap-1">
                    <strong className="text-[#20120e]">{link.platform}</strong>
                    <span className="text-xs text-[#746157]">
                      {link.clickCount || 0} clicks
                    </span>
                  </div>
                  <input
                    className={inputClass}
                    placeholder={
                      getSocialPlatformConfigByLabel(link.platform)?.placeholder ||
                      "https://..."
                    }
                    value={link.url}
                    onChange={(event) =>
                      updateSocialLink(index, "url", event.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <button
              className={`${primaryButtonClass} w-full sm:w-auto`}
              type="submit"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>

            <button
              className={`${dangerButtonClass} w-full sm:w-auto`}
              type="button"
              disabled={accountDeleting}
              onClick={handleDeleteAccount}
            >
              {accountDeleting ? "Deleting Account..." : "Delete Account"}
            </button>
          </form>
        </article>

        <article className={panelClass}>
          <div className="mb-5">
            <p className={eyebrowClass}>QR Menu</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Share this QR for this owner only
            </h2>
          </div>

          <div className="grid gap-4">
            <img
              src={dashboard.qrCodeUrl}
              alt="QR for menu"
              className="mx-auto aspect-square w-full max-w-60 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white p-4 object-contain"
            />
            <a
              className={`${primaryButtonClass} w-full`}
              href={dashboard.qrCodeUrl}
              download
            >
              Download QR
            </a>
            <div className="grid gap-2">
              <p className="m-0 text-sm text-[#746157]">Public menu URL</p>
              <a
                className="break-all text-sm font-medium text-[#20120e] underline decoration-[#d95722]/35 underline-offset-4"
                href={dashboard.publicMenuUrl}
                target="_blank"
                rel="noreferrer"
              >
                {dashboard.publicMenuUrl}
              </a>
            </div>
          </div>
        </article>
      </section>

      <section className={panelClass}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={eyebrowClass}>Menu Items</p>
            <h2 className="text-2xl font-black text-[#20120e]">
              Upload multiple food items for this cart or hotel
            </h2>
          </div>
          <button
            className={`${ghostButtonClass} w-full sm:w-auto`}
            type="button"
            onClick={addMenuDraft}
          >
            Add Another Item
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleMenuSubmit}>
          <div className="grid gap-4">
            {menuDrafts.map((draft, index) => (
              <article
                className="grid gap-4 rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/72 p-4"
                key={draft.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={eyebrowClass}>Item {index + 1}</p>
                    <h3 className="text-lg font-bold text-[#20120e]">
                      Menu card details
                    </h3>
                  </div>
                  {menuDrafts.length > 1 ? (
                    <button
                      className={`${dangerButtonClass} w-full sm:w-auto`}
                      type="button"
                      onClick={() => removeMenuDraft(draft.id)}
                    >
                      Remove Item
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Item name">
                    <input
                      className={inputClass}
                      value={draft.name}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "name", event.target.value)
                      }
                      placeholder="Item name"
                    />
                  </Field>

                  <Field label="Category">
                    <input
                      className={inputClass}
                      list="menu-category-options"
                      value={draft.category}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "category", event.target.value)
                      }
                      placeholder="Optional: Starters, Main Course, Juices"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Price">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "price", event.target.value)
                      }
                      placeholder="Price"
                    />
                  </Field>
                  <Field label="Food type">
                    <select
                      className={inputClass}
                      value={draft.foodType}
                      onChange={(event) =>
                        updateMenuDraft(draft.id, "foodType", event.target.value)
                      }
                    >
                      {foodTypeConfigs.map((foodType) => (
                        <option key={foodType.id} value={foodType.id}>
                          {foodType.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    className={inputClass}
                    rows="3"
                    value={draft.description}
                    onChange={(event) =>
                      updateMenuDraft(
                        draft.id,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Description"
                  />
                </Field>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <Field label="Image">
                    <input
                      key={`${draft.id}-${fileInputSeed}`}
                      className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#20120e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        updateMenuDraft(
                          draft.id,
                          "image",
                          event.target.files?.[0] || null,
                        )
                      }
                    />
                  </Field>

                  <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white/60 px-4 py-3">
                    <input
                      className="h-4 w-4 shrink-0 accent-[#d95722]"
                      type="checkbox"
                      checked={draft.available}
                      onChange={(event) =>
                        updateMenuDraft(
                          draft.id,
                          "available",
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm text-[#746157]">
                      Available for public menu
                    </span>
                  </label>
                </div>
              </article>
            ))}
          </div>

          <datalist id="menu-category-options">
            {ownerCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <button
            className={`${primaryButtonClass} w-full sm:w-auto`}
            type="submit"
            disabled={menuSaving}
          >
            {menuSaving
              ? "Uploading..."
              : `Upload ${menuDrafts.length} Menu Item${menuDrafts.length > 1 ? "s" : ""}`}
          </button>
        </form>

        <div className="mt-6 grid gap-6">
          {dashboard.menuItems.length > 0 ? (
            groupedDashboardItems.map((group) => (
              <section className="grid gap-4" key={group.id}>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-[rgba(83,48,34,0.12)]" />
                  <p className="rounded-full bg-[#20120e] px-4 py-2 text-sm font-semibold text-white">
                    {group.category}
                  </p>
                  <span className="h-px flex-1 bg-[rgba(83,48,34,0.12)]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <article
                      className="overflow-hidden rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92"
                      key={item.id}
                    >
                      <div className="flex aspect-4/3 w-full items-center justify-center bg-[#fff8f2] p-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="block h-full w-full object-contain"
                        />
                      </div>
                      <div className="grid gap-4 p-4">
                        {editingItemId === item.id && editDraft ? (
                          <>
                            <div className="grid gap-4">
                              <Field label="Item name">
                                <input
                                  className={inputClass}
                                  value={editDraft.name}
                                  onChange={(event) =>
                                    updateEditDraft("name", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Category">
                                <input
                                  className={inputClass}
                                  list="menu-category-options"
                                  value={editDraft.category}
                                  onChange={(event) =>
                                    updateEditDraft("category", event.target.value)
                                  }
                                  placeholder="Optional category"
                                />
                              </Field>
                              <Field label="Price">
                                <input
                                  className={inputClass}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editDraft.price}
                                  onChange={(event) =>
                                    updateEditDraft("price", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Food type">
                                <select
                                  className={inputClass}
                                  value={editDraft.foodType}
                                  onChange={(event) =>
                                    updateEditDraft("foodType", event.target.value)
                                  }
                                >
                                  {foodTypeConfigs.map((foodType) => (
                                    <option key={foodType.id} value={foodType.id}>
                                      {foodType.label}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Description">
                                <textarea
                                  className={inputClass}
                                  rows="3"
                                  value={editDraft.description}
                                  onChange={(event) =>
                                    updateEditDraft("description", event.target.value)
                                  }
                                />
                              </Field>
                              <Field label="Replace image">
                                <input
                                  className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#20120e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    updateEditDraft(
                                      "image",
                                      event.target.files?.[0] || null,
                                    )
                                  }
                                />
                              </Field>
                              <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[rgba(83,48,34,0.12)] bg-white/60 px-4 py-3">
                                <input
                                  className="h-4 w-4 shrink-0 accent-[#d95722]"
                                  type="checkbox"
                                  checked={editDraft.available}
                                  onChange={(event) =>
                                    updateEditDraft("available", event.target.checked)
                                  }
                                />
                                <span className="text-sm text-[#746157]">
                                  Available for public menu
                                </span>
                              </label>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                className={`${primaryButtonClass} w-full sm:w-auto`}
                                type="button"
                                disabled={editMenuSaving}
                                onClick={() => saveEditedMenuItem(item.id)}
                              >
                                {editMenuSaving ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                className={`${ghostButtonClass} w-full sm:w-auto`}
                                type="button"
                                disabled={editMenuSaving}
                                onClick={cancelEditingMenuItem}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="grid gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="w-fit rounded-full bg-[#d95722]/10 px-3 py-1 text-xs font-semibold text-[#d95722]">
                                    {item.category || "Uncategorized"}
                                  </span>
                                  <FoodTypeIcon
                                    type={item.foodType}
                                    label={getFoodTypeConfig(item.foodType).label}
                                  />
                                </div>
                                <h3 className="text-xl font-bold text-[#20120e]">
                                  {item.name}
                                </h3>
                              </div>
                              <span className="rounded-full bg-[#1f6a5b]/10 px-4 py-3 text-center text-sm font-bold text-[#1f6a5b]">
                                Rs. {Number(item.price).toFixed(2)}
                              </span>
                            </div>
                            {item.description ? (
                              <p className="wrap-break-word text-[#746157]">
                                {item.description}
                              </p>
                            ) : null}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <span
                                className={`rounded-full px-4 py-3 text-center text-sm font-bold ${
                                  item.available
                                    ? "bg-[#1d7d53]/10 text-[#1d7d53]"
                                    : "bg-[#ad2f2f]/8 text-[#ad2f2f]"
                                }`}
                              >
                                {item.available ? "Visible in QR menu" : "Hidden"}
                              </span>
                              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <button
                                  className={`${ghostButtonClass} w-full sm:w-auto`}
                                  type="button"
                                  onClick={() => startEditingMenuItem(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`${dangerButtonClass} w-full sm:w-auto`}
                                  type="button"
                                  onClick={() => deleteMenuItem(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-[rgba(83,48,34,0.12)] bg-white/92 p-4">
              No menu items yet. Upload the first items for this business.
            </div>
          )}
        </div>
      </section>

      <footer className={`${panelClass} mt-5 flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-[#d95722]">
            Powered by
          </span>
          <a
            href="https://menueyalli.cloud"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-end text-sm font-semibold text-[#20120e]"
            aria-label="MenueYalli website"
          >
            <img
              src="/assets/menu_logo.png"
              alt="MenueYalli"
              className="h-6 w-auto object-contain"
            />
            <span>.cloud</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default DashboardPage;
