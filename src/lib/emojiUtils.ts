// Contextual emoji detector for gift options and open ideas
export function detectGiftEmoji(name: string): string {
  if (!name) return '💡';
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Dinero / Gift Cards / Efectivo
  if (/dinero|plata|efectivo|gift\s*card|tarjeta\s*de\s*regalo|cash|transferencia|lucas|ahorro|presupuesto/.test(n)) {
    return '💵';
  }

  // 2. Skincare / Cuidado facial / Cosmética / Perfumes
  if (
    /limpiador|crema|serum|skincare|bloqueador|solar|facial|piel|tonico|exfoliante|mascarilla|labial|maquillaje|makeup|balsamo|pestana|perfume|colonia|locion|retinal|acido|hidratante|panthenol|calming|bambu|azelaico|shampoo|jabon|bano/.test(
      n
    )
  ) {
    return '🧴';
  }

  // 3. Libros / Manga / Cómics / Lectura
  if (/libro|manga|comic|novela|tomo|volumen|lectura|bleach|naruto|one\s*piece|dragon\s*ball|cuento|literatura/.test(n)) {
    return '📚';
  }

  // 4. Ropa / Moda / Vestuario
  if (
    /poleron|polera|camisa|pantalon|jeans|chaqueta|calcetin|calcetines|ropa|vestido|falda|short|parka|chaleco|buzo|pijama|boxer|calzoncillo|gorro|jockey/.test(
      n
    )
  ) {
    return '👕';
  }

  // 5. Calzado / Zapatillas
  if (/zapatilla|zapato|bota|sandalia|sneaker|calzado|chala/.test(n)) {
    return '👟';
  }

  // 6. Videojuegos / Consolas / Gaming
  if (/juego\s*de|videojuego|playstation|ps5|ps4|nintendo|switch|xbox|gamer|consola|joystick|mando|steam/.test(n)) {
    return '🎮';
  }

  // 7. Música / Audio
  if (/audifono|parlante|auricular|musica|vinilo|disco|airpods|headphone|altavoz|sound/.test(n)) {
    return '🎧';
  }

  // 8. Tecnología / Celulares / Computación
  if (/celular|telefono|mouse|teclado|cargador|bateria|power\s*bank|smartwatch|reloj\s*inteligente|ipad|tablet|monitor|cable|apple|samsung/.test(n)) {
    return '📱';
  }

  // 9. Bebidas / Café / Té / Chocolates / Dulces
  if (/chocolate|dulce|snack|cafe|cafetera|te\b|taza|mug|vaso|botella|termo|vino|cerveza|licor|copa|gin|whisky|bombones/.test(n)) {
    return '☕';
  }

  // 10. Cocina / Repostería
  if (/cocina|sarten|olla|cuchillo|reposteria|delantal|tabla|horno|molde/.test(n)) {
    return '🍳';
  }

  // 11. Decoración / Velas / Hogar
  if (/vela|aroma|difusor|planta|cojin|manta|frazada|adorno|cuadro|lampara|luces|sabanas|toalla/.test(n)) {
    return '🕯️';
  }

  // 12. Deporte / Fitness
  if (/gym|pesa|mancuerna|yoga|mat|entrenamiento|crossfit|pelota|balon|deporte|futbol|running|ciclismo|bicicleta|gimnasio/.test(n)) {
    return '🏋️';
  }

  // 13. Juegos de mesa
  if (/juego\s*de\s*mesa|cartas|boardgame|puzzle|rompecabezas|catan|monopoly|uno\b|dado/.test(n)) {
    return '🎲';
  }

  // 14. Joyería / Accesorios / Lentes
  if (/reloj|anillo|collar|aro|aros|pulsera|cadena|joya|lente|gafas|joyeria/.test(n)) {
    return '💍';
  }

  // 15. Bolsos / Mochilas / Billeteras
  if (/mochila|bolso|cartera|banano|billetera|maleta|neceser|porta\s*documento/.test(n)) {
    return '🎒';
  }

  // 16. Mascotas
  if (/perro|gato|mascota|pet|cachorro|gatito/.test(n)) {
    return '🐾';
  }

  return '💡';
}

export const POPULAR_EMOJIS = ['🧴', '💵', '👕', '👟', '📚', '🎧', '🎮', '📱', '☕', '🍫', '🕯️', '🏋️', '🎲', '💍', '🎒', '💡', '🎁'];
