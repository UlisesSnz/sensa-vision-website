"use client";

import { Select } from "@sanity/ui";
import { set, unset, useFormValue, type StringInputProps } from "sanity";
import { DEFAULT_HERO_SCENE, HERO_SCENES } from "@/lib/hero-screen";

export default function HeroSceneInput({
  elementProps,
  onChange,
  path,
  readOnly,
  validationError,
  value,
}: StringInputProps) {
  const isOverride = path.at(-1) === "scene";
  // A template field is nested under slides, its item key and scene.
  const base = useFormValue(
    isOverride ? [...path.slice(0, -3), "baseScene"] : path,
  );
  const baseTitle = HERO_SCENES.find(
    (scene) => scene.value === (base ?? DEFAULT_HERO_SCENE),
  )?.title;

  return (
    <Select
      {...elementProps}
      readOnly={readOnly}
      customValidity={validationError}
      value={value ?? (isOverride ? "" : DEFAULT_HERO_SCENE)}
      onChange={(event) => {
        const scene = event.currentTarget.value;
        onChange(scene ? set(scene) : unset());
      }}
    >
      {isOverride && (
        <option value="">{baseTitle ? `Use default (${baseTitle})` : "Use default"}</option>
      )}
      {HERO_SCENES.map((scene) => (
        <option key={scene.value} value={scene.value}>
          {scene.title}
        </option>
      ))}
    </Select>
  );
}
