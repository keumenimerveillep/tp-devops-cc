const DB = (() => {
  const STORAGE_KEY = "maison_elegance_catalog_v1";
  const CART_KEY = "maison_elegance_cart_v1";
  const CURRENCY_VERSION_KEY = "maison_elegance_currency_v1";
  const EUR_TO_XOF = 655.957;

  const DEFAULT_PRODUCTS = [
    {
      id: "vet-1",
      name: "Trench fluide en coton organique",
      category: "Nouveautés",
      price: 123976,
      stock: 9,
      badge: "Nouveau",
      sizes: ["XS", "S", "M", "L"],
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
      description: "Coupe droite et ceinture amovible en twill de coton déperlant. Idéal à la mi-saison."
    },
    {
      id: "vet-2",
      name: "Pull maille côtelée mérinos",
      category: "Femme",
      price: 75435,
      stock: 14,
      badge: "Best-seller",
      sizes: ["S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
      description: "Tricotage doux en laine mérinos fine, col rond légèrement dégagé et finitions bord-côte."
    },
    {
      id: "vet-3",
      name: "Surchemise structurée en lin & coton",
      category: "Homme",
      price: 88554,
      stock: 11,
      badge: "Essentiel",
      sizes: ["S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      description: "Pièce polyvalente à porter ouverte sur un t-shirt ou boutonnée avec un pantalon chino."
    },
    {
      id: "vet-4",
      name: "Pantalon taille haute à pinces",
      category: "Femme",
      price: 64284,
      stock: 7,
      badge: "",
      sizes: ["XS", "S", "M", "L"],
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
      description: "Tombé fluide et pinces marquées sur l’avant pour une silhouette allongée."
    },
    {
      id: "vet-5",
      name: "Veste blazer croisée texturée",
      category: "Homme",
      price: 144311,
      stock: 5,
      badge: "Édition limitée",
      sizes: ["M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      description: "Doublure respirante et boutons effet corne pour un style formel ou décontracté chic."
    },
    {
      id: "vet-6",
      name: "Cabas cuir grainé & anses longues",
      category: "Accessoires",
      price: 108233,
      stock: 8,
      badge: "Coup de cœur",
      sizes: ["Unique"],
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      description: "Format spacieux avec poche intérieure zippée pour transporter vos essentiels quotidiens."
    },
    {
      id: "vet-7",
      name: "Robe chemise ceinturée en popeline",
      category: "Nouveautés",
      price: 95114,
      stock: 10,
      badge: "Nouveau",
      sizes: ["XS", "S", "M", "L"],
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      description: "Popeline de coton lumineuse, patte de boutonnage dissimulée et ceinture ton sur ton."
    },
    {
      id: "vet-8",
      name: "Écharpe épaisse en laine brossée",
      category: "Accessoires",
      price: 38701,
      stock: 20,
      badge: "",
      sizes: ["Unique"],
      image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80",
      description: "Chaleur enveloppante et franges délicates pour affronter les journées fraîches."
    }
  ];

  function loadProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        saveProducts(DEFAULT_PRODUCTS);
        localStorage.setItem(CURRENCY_VERSION_KEY, "fcfa-v1");
        return [...DEFAULT_PRODUCTS];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...DEFAULT_PRODUCTS];

      if (localStorage.getItem(CURRENCY_VERSION_KEY) !== "fcfa-v1") {
        const converted = parsed.map((item) => ({
          ...item,
          price: Math.round(Number(item.price || 0) * EUR_TO_XOF)
        }));
        saveProducts(converted);
        localStorage.setItem(CURRENCY_VERSION_KEY, "fcfa-v1");
        return converted;
      }

      return parsed;
    } catch {
      return [...DEFAULT_PRODUCTS];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function resetProducts() {
    const copy = DEFAULT_PRODUCTS.map((item) => ({ ...item, sizes: [...item.sizes] }));
    saveProducts(copy);
    localStorage.setItem(CURRENCY_VERSION_KEY, "fcfa-v1");
    return copy;
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  return {
    loadProducts,
    saveProducts,
    resetProducts,
    loadCart,
    saveCart
  };
})();