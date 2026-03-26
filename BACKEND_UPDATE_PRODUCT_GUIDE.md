# Guide backend : corriger la mise à jour produit (éviter 500)

L’erreur **500 Internal Server Error** lors du PUT produit vient souvent du backend qui tente de mettre à jour des colonnes inexistantes (ex. `variations`) ou qui ne gère pas correctement la réponse.

## 1. Vérifier que l’entité existe

```php
// Exemple dans ProductController ou ProductService
public function update(Request $request, $id)
{
    $product = Product::findOrFail($id); // 404 si non trouvé
    // ...
}
```

## 2. N’envoyer que les champs autorisés

Ne pas faire `$product->update($request->all())`. Utiliser soit les **champs fillable**, soit une liste explicite :

```php
// Option A : $fillable dans le modèle Product
// Assurez-vous que 'variations' n'est PAS dans $fillable si la colonne n'existe pas

// Option B : liste explicite dans le controller
$validated = $request->validate([
    'name' => 'sometimes|string',
    'slug' => 'sometimes|string',
    'price' => 'sometimes|numeric',
    'sale_price' => 'nullable|numeric',
    'quantity' => 'nullable|integer',
    'unit' => 'sometimes|string',
    'description' => 'nullable|string',
    'status' => 'sometimes|string',
    'shop_id' => 'sometimes|exists:shops,id',
    'type_id' => 'nullable|exists:types,id',
    // N'inclure que les colonnes qui existent dans la table products
    // Ne pas mettre : variations, etc. si stocké ailleurs
]);

$product->update($validated);
```

## 3. Gérer les relations à part (catégories, images, etc.)

Si le front envoie `categories`, `gallery`, `variations`, etc., les mettre à jour via des relations ou des tables pivot, pas comme colonnes directes :

```php
// Exemple : catégories en table pivot
if ($request->has('categories')) {
    $product->categories()->sync($request->categories);
}
```

## 4. Réponse JSON de succès

Retourner une réponse claire (200 ou 200 + body) :

```php
return response()->json([
    'success' => true,
    'message' => 'Projet mis à jour avec succès',
    'data' => $product->fresh(),
], 200);
```

Le frontend attend au minimum que la requête soit en **2xx** et utilise `data?.slug` pour la redirection. Un body avec `slug` est donc utile.

## 5. Erreurs 422 ou 404 au lieu de 500

- **404** : produit introuvable → `findOrFail` ou `Product::find($id) ?? abort(404)`.
- **422** : validation échouée → `return response()->json(['message' => '...', 'errors' => $validator->errors()], 422);`
- En cas d’exception non gérée, éviter de renvoyer 500 sans message : logger l’erreur et renvoyer un JSON avec `message` lisible.

## 6. Vérifier la route et la méthode

- Route : `PUT` ou `PATCH` `/api/products/{id}` (selon votre API).
- Le frontend envoie **PUT** vers `API_ENDPOINTS.PRODUCTS + '/' + id` avec le body sans `id`.

Après ces corrections, le backend ne doit plus renvoyer 500 pour une mise à jour valide, et le frontend affichera « Projet mis à jour avec succès » après une réponse 2xx.
