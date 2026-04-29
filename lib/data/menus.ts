import {
    LayoutDashboard,
    Package,
    PlusSquare,
    Building,
    FileText,
  } from "lucide-react"
  
  export const menusByRole = {
    admin: [
      { label: "Dashboard", route: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Créer produit", route: "/admin/produits/create", icon: PlusSquare },
      { label: "Catalogue produits", route: "/admin/produits", icon: Package },
      { label: "Etablissements", route: "/admin/etablissements", icon: Building },
      { label: "Liste des devis", route: "/admin/devis", icon: FileText },
    ],
  
    etablissement: [
      //{ label: "Dashboard", route: "/etablissement/dashboard", icon: LayoutDashboard },
      { label: "Catalogue produits", route: "/etablissement/produits", icon: Package },
      { label: "Mes devis", route: "/etablissement/devis", icon: FileText },
      { label: "Créer devis", route: "/etablissement/devis/create", icon: PlusSquare },
    ],
  
    responsable: [
      { label: "Dashboard", route: "/responsable/dashboard", icon: LayoutDashboard, requiresOrgHead: true },
      { label: "Catalogue produits", route: "/responsable/produits", icon: Package },
      { label: "Mes devis", route: "/responsable/devis", icon: FileText },
      { label: "Créer devis", route: "/responsable/devis/create", icon: PlusSquare },
      //{ label: "Devis à valider", route: "devis", icon: FileText },
    ],
  }
  