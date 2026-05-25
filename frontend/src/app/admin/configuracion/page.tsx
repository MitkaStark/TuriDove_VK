"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Bell, Moon, Globe, Shield, Save, Percent, DollarSign, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

// Persist margins in localStorage (in production: save to backend/DB)
function getMargins() {
  if (typeof window === "undefined") return { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 };
  try {
    const saved = localStorage.getItem("admin-margins");
    return saved ? JSON.parse(saved) : { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 };
  } catch { return { hospedajes: 15, actividades: 12, transfers: 10, vehiculos: 10, global: 15 }; }
}

function saveMargins(margins: any) {
  localStorage.setItem("admin-margins", JSON.stringify(margins));
}

export default function AdminConfiguracionPage() {
  const { t, language, setLanguage } = useTranslation();
  const [notificaciones, setNotificaciones] = useState("todas");
  const [tema, setTema] = useState("claro");

  // Margins state
  const [margins, setMargins] = useState(getMargins());
  const [marginType, setMarginType] = useState<"global" | "individual">("global");

  useEffect(() => {
    setMargins(getMargins());
  }, []);

  const updateMargin = (key: string, value: string) => {
    const num = parseFloat(value) || 0;
    setMargins((prev: any) => ({ ...prev, [key]: Math.min(100, Math.max(0, num)) }));
  };

  const handleSave = () => {
    saveMargins(margins);
    toast.success(language === 'en' ? "Settings and margins saved" : "Configuración y margenes guardados");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} description={t('settings.sub')} />

      <div className="max-w-2xl space-y-6">
        {/* Margen de Ganancias - Solo Admin */}
        <div className="card-base p-6 space-y-4 border-primary/20 border-2">
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{language === 'en' ? 'Profit Margins' : 'Margen de Ganancias'}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'en'
              ? 'Set the profit margin percentage applied to each service type. This margin is added to the provider\'s base price.'
              : 'Define el porcentaje de margen de ganancia aplicado a cada tipo de servicio. Este margen se agrega al precio base del proveedor.'}
          </p>

          <div className="space-y-2">
            <Label>{language === 'en' ? 'Margin type' : 'Tipo de margen'}</Label>
            <Select value={marginType} onValueChange={(v) => setMarginType(v as any)}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">{language === 'en' ? 'Global (same for all)' : 'Global (igual para todos)'}</SelectItem>
                <SelectItem value="individual">{language === 'en' ? 'Individual (per service)' : 'Individual (por servicio)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {marginType === "global" ? (
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Global margin (%)' : 'Margen global (%)'}</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input type="number" min="0" max="100" step="0.5" value={margins.global} onChange={(e) => updateMargin("global", e.target.value)} />
                <span className="text-lg font-semibold text-primary">%</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {language === 'en'
                  ? `A $100 service will be charged $${(100 * (1 + margins.global / 100)).toFixed(2)} to the customer`
                  : `Un servicio de $100 se cobrara $${(100 * (1 + margins.global / 100)).toFixed(2)} al cliente`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {language === 'en' ? 'Lodging' : 'Hospedajes'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" step="0.5" value={margins.hospedajes} onChange={(e) => updateMargin("hospedajes", e.target.value)} />
                    <span className="font-semibold text-primary">%</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    {language === 'en' ? 'Activities' : 'Actividades'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" step="0.5" value={margins.actividades} onChange={(e) => updateMargin("actividades", e.target.value)} />
                    <span className="font-semibold text-primary">%</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    Transfers
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" step="0.5" value={margins.transfers} onChange={(e) => updateMargin("transfers", e.target.value)} />
                    <span className="font-semibold text-primary">%</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    {language === 'en' ? 'Vehicles' : 'Vehiculos'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" max="100" step="0.5" value={margins.vehiculos} onChange={(e) => updateMargin("vehiculos", e.target.value)} />
                    <span className="font-semibold text-primary">%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{language === 'en' ? 'Summary:' : 'Resumen:'}</p>
                <p>{language === 'en' ? 'Lodging' : 'Hospedajes'}: {margins.hospedajes}% → $100 → ${(100 * (1 + margins.hospedajes / 100)).toFixed(2)}</p>
                <p>{language === 'en' ? 'Activities' : 'Actividades'}: {margins.actividades}% → $100 → ${(100 * (1 + margins.actividades / 100)).toFixed(2)}</p>
                <p>Transfers: {margins.transfers}% → $100 → ${(100 * (1 + margins.transfers / 100)).toFixed(2)}</p>
                <p>{language === 'en' ? 'Vehicles' : 'Vehiculos'}: {margins.vehiculos}% → $100 → ${(100 * (1 + margins.vehiculos / 100)).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Idioma */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('settings.language')}</h3></div>
          <div className="space-y-2">
            <Label>{t('settings.language.label')}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'es' | 'en')}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Espanol</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('settings.notifications')}</h3></div>
          <div className="space-y-2">
            <Label>{t('settings.notifications.label')}</Label>
            <Select value={notificaciones} onValueChange={setNotificaciones}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t('settings.notifications.all')}</SelectItem>
                <SelectItem value="importantes">{t('settings.notifications.important')}</SelectItem>
                <SelectItem value="ninguna">{t('settings.notifications.none')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Apariencia */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-3"><Moon className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('settings.appearance')}</h3></div>
          <div className="space-y-2">
            <Label>{t('settings.appearance.label')}</Label>
            <Select value={tema} onValueChange={setTema}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">{t('settings.appearance.light')}</SelectItem>
                <SelectItem value="oscuro">{t('settings.appearance.dark')}</SelectItem>
                <SelectItem value="sistema">{t('settings.appearance.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seguridad */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('settings.security')}</h3></div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('settings.security.password')}</p>
            <p>{t('settings.security.session')} <span className="font-medium text-foreground">{t('settings.security.browser')}</span></p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />{t('settings.save')}</Button>
        </div>
      </div>
    </div>
  );
}
