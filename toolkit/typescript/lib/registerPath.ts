/*
  A decorator that registers a new express route on the given path based on the objects express router
*/

import { Request, Response } from "express";
import { Module } from "../Module";

export function registerPost(path: string) {
  return function (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey)!;
    }

    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new Error("Decorated member is not a method.");
    }

    descriptor.value = function (...args: any[]) {
      const instance = this as Module;
      if (!instance.toolkit) {
        throw new Error("Toolkit not initialized in target module.");
      }

      const tk = instance.toolkit;
      const fullPath = `/module/${instance.type}/${path}`;

      tk.app.post(fullPath, async (req: Request, res: Response) => {
        try {
          const result = await originalMethod.call(instance, req.body);
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: (error as Error).message });
        }
      });

      return originalMethod.apply(this, args) as any;
    };
  };
}
