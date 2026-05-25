"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, Moon, Globe, Shield, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

export default function ConfiguracionPage() {
  const { t, language, setLanguage } = useTranslation();
  const [notificaciones, setNotificaciones] = useState("todas");
  const [tema, setTema] = useState("claro");

  const handleSave = () => {
    toast.success(language === 'en' ? "Settings saved" : "Configuración guardada");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} description={t('settings.sub')} />

      <div className="max-w-2xl space-y-6">
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
