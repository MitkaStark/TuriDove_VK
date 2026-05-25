"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const AMENIDADES_SUGERIDAS = [
  "WiFi", "Piscina", "Estacionamiento", "BBQ", "Restaurante",
  "Cocina", "Cocina comunitaria", "Agua caliente", "Desayuno incluido",
  "Senderismo", "Senderos", "Mirador", "Hamacas", "Jardín",
  "Vista al mar", "Playa", "Playa privada", "Rio", "Piscina natural",
  "Kayak", "Snorkel", "Surf", "Pesca", "Cabalgata", "Canoa",
  "Huerto", "Huerto organico", "Tour de cafe", "Tour de cacao",
  "Avistamiento de aves", "Fogata", "Chimenea", "Bar", "Biblioteca",
  "Yoga", "Talleres", "Guia local", "Guia naturalista",
  "Bosque nuboso", "Parque Nacional", "Permacultura",
  "Chocolate artesanal", "Frutas tropicales", "Ordeño",
];

interface AmenidadesSelectorProps {
  value: string[];
  onChange: (amenidades: string[]) => void;
}

export function AmenidadesSelector({ value, onChange }: AmenidadesSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addAmenidad = (amenidad: string) => {
    const trimmed = amenidad.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeAmenidad = (amenidad: string) => {
    onChange(value.filter((a) => a !== amenidad));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addAmenidad(inputValue);
      }
    }
  };

  const filteredSuggestions = AMENIDADES_SUGERIDAS.filter(
    (a) =>
      !value.includes(a) &&
      a.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Amenidades</Label>

      {/* Selected amenidades */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
            >
              {a}
              <button
                type="button"
                onClick={() => removeAmenidad(a)}
                className="rounded-full hover:bg-primary/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + add button */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="Escribir amenidad o seleccionar..."
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => { if (inputValue.trim()) addAmenidad(inputValue); }}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border bg-background shadow-lg">
            {filteredSuggestions.slice(0, 12).map((s) => (
              <button
                key={s}
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                onMouseDown={(e) => { e.preventDefault(); addAmenidad(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe y presiona Enter, o selecciona de las sugerencias
      </p>
    </div>
  );
}
