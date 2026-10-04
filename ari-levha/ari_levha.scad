// Arı nakış levhası (parametrik) — OpenSCAD'de açıp F6 + "Export STL"
adim = 5;        // delikler arası mesafe (mm)
delik_cap = 3.2; // delik çapı (mm)
kalinlik = 2.4;  // levha kalınlığı (mm)
delik_x = 29;    // yatay delik sayısı (28 ilmek)
delik_y = 23;    // dikey delik sayısı (22 ilmek)
kenar = 10;      // deliksiz kenar payı (mm)

difference() {
  cube([(delik_x - 1) * adim + 2 * kenar, (delik_y - 1) * adim + 2 * kenar, kalinlik]);
  for (i = [0 : delik_x - 1], j = [0 : delik_y - 1])
    translate([kenar + i * adim, kenar + j * adim, -1])
      cylinder(d = delik_cap, h = kalinlik + 2, $fn = 24);
}
