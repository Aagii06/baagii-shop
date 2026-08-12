"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ShippingInfo } from "@/types/order";
import { useState } from "react";

interface ShippingFormProps {
  onSubmit: (shippingInfo: ShippingInfo) => void;
  isSubmitting: boolean;
}

const emptyShippingInfo: ShippingInfo = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export default function ShippingForm({
  onSubmit,
  isSubmitting,
}: ShippingFormProps) {
  const [shippingInfo, setShippingInfo] =
    useState<ShippingInfo>(emptyShippingInfo);

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(shippingInfo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              required
              value={shippingInfo.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              required
              value={shippingInfo.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <Input
              id="address"
              required
              value={shippingInfo.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Input
                id="city"
                required
                value={shippingInfo.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="postalCode" className="text-sm font-medium">
                Postal Code
              </label>
              <Input
                id="postalCode"
                required
                value={shippingInfo.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Placing Order..." : "Захиалга үүсгэх"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
