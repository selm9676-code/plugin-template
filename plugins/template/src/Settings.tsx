import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

const { FormSection, FormRadioRow, FormSlider, FormText, FormDivider } = Forms;

export default function Settings() {
  useProxy(storage);
  return (
    <>
      <FormSection title="Double Tap Action">
        <FormRadioRow
          label="Edit message"
          subLabel="Double tap opens the edit box (your messages only)"
          selected={storage.mode === "edit"}
          onPress={() => (storage.mode = "edit")}
        />
        <FormRadioRow
          label="Delete message"
          subLabel="Double tap deletes (yours anywhere, others' if you have permission)"
          selected={storage.mode === "delete"}
          onPress={() => (storage.mode = "delete")}
        />
      </FormSection>
      <FormDivider />
      <FormSection title="Timing">
        <FormText>Tap window: {storage.threshold}ms</FormText>
        <FormSlider
          minimumValue={150}
          maximumValue={600}
          step={50}
          value={storage.threshold}
          onValueChange={(v: number) => (storage.threshold = Math.round(v))}
        />
      </FormSection>
    </>
  );
}
