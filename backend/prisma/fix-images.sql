-- Add user-uploaded images back to hospedajes that had them
-- Cabañas Cerro Azul (user uploaded 3 images for this one based on screenshots)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/0d11c571-e45b-449f-aca4-692cf5f3a7bc.jpg","/uploads/24cd873c-ec44-4dae-9d1c-a8a017989cd5.jpg","/uploads/385a0a7d-3b22-4cbc-b115-4003ed798b15.jpg"}'
WHERE nombre LIKE '%Cerro Azul%';

-- Posada Rio Caldera (user uploaded images)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/598309bf-769d-4837-a794-71119a618345.jpg","/uploads/74ee0f94-ed0e-4575-a1a2-60686a24ea0f.jpg"}'
WHERE nombre = 'Posada Rio Caldera';

-- Rancho Tipico Azuero (user uploaded images)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/4c07230d-bb01-49ca-a94a-e7a182f09dec.jpg","/uploads/7d06d911-9ee7-4e88-88bf-97a62f579eb1.jpg"}'
WHERE nombre LIKE '%Azuero%';

-- Cabañas Bosque Nuboso (user uploaded)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/ca4af5a1-832d-4c18-bec1-8b77d3ed4e35.jpg","/uploads/de6cc25f-b81f-40f1-9d4e-582bc5dd0016.jpg"}'
WHERE nombre LIKE '%Bosque Nuboso%';

-- Cabañas del Volcán (user uploaded)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/afe4ae4e-af9f-40ba-af30-af6d9d6eda31.jpg","/uploads/cfdaf910-6f71-4a6a-8a61-5570a1a486f5.jpg"}'
WHERE nombre LIKE '%Volc%';

-- Finca Loma Verde (user uploaded)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/8ea6670a-c001-436a-a7d6-1cd09f4b859a.jpg","/uploads/f2bf7172-9503-4b70-85ea-020bf5cf45df.jpg"}'
WHERE nombre = 'Finca Loma Verde';

-- Eco Lodge Rio Sereno (user uploaded)
UPDATE hospedajes SET imagenes = imagenes || '{"/uploads/7a60a42d-1bfc-43c5-bfa1-e01db6377e5a.jpg","/uploads/f010b09a-9491-42fd-8cff-f55a331f16c3.jpg"}'
WHERE nombre = 'Eco Lodge Rio Sereno';
