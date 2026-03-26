export interface Avatar {
    id: number;
    original: string;
    thumbnail?: string | null;
}

export interface Profile {
    id: number;
    bio?: string | null;
    socials?: string | null;
    contact?: string | null;
    avatar_id?: number | null;
    avatar?: Avatar | null;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    shop_id: number;
    // autres champs produits
}

export interface Shop {
    id: number;
    name: string;
    user_id: number;
    products?: Product[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    // autres champs user
    profile?: Profile | null;
    avatar?: Avatar | null;
    shops?: Shop[];
}
