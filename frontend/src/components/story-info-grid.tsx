// PAUSE — badge informativo della storia: tre pill individuali affiancate,
// di larghezza uniforme, con fondo scuro traslucido e bordo luminoso discreto.
// Prima pill: solo icona del tipo. Seconda pill: solo icona della categoria.
// Terza pill: orologio + tempo di lettura ("5 min") sulla stessa riga.
// Le icone originali restano identiche (stessa dimensione visiva), cambia solo
// l'involucro. Usato in Home card, apertura del lettore e transizione morph.
import { View, Text } from "react-native";
import { Image } from "expo-image";

import { StoryPreview, isLesson } from "@/src/api";
import { makeStyles, typography, withAlpha } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { KindIcon } from "./kind-icon";
import { CategoryArtMark } from "./category-artwork";
import { HoloClock } from "./holo-icons";
import { GemSymbol } from "./gem-icons";
import { useIconFamily } from "@/src/icon-theme";

// Dimensioni finali comuni a tema 3D e Olografico, scelte perché la parte
// visibile delle tre icone (lampadina/libri · oggetto categoria · orologio)
// abbia la stessa altezza (~23px). `KindIcon` e l'orologio PNG hanno ~15% di
// margine trasparente dentro l'immagine, la categoria è ritagliata stretta
// (`tight`): servono misure diverse per compensare.
const GLYPH = 32;      // lampadina / libri · orologio (sia 3D che Olografico)
const CATEGORY = 23;   // categoria ritagliata (sia 3D che Olografico) — ~15% più piccola di libri/orologio
// Orologio 3D generato nello stesso stile delle icone categoria e dei CTA.
const CLOCK = require("../../assets/images/kind-clock.png");

export function StoryInfoGrid({ story, minutes, inline = false, embedded = false, testID = "story-info-grid" }: {
  story: StoryPreview; minutes: number;
  /** Lettura/Home: barra "vetro" che racchiude le tre pill. */
  inline?: boolean;
  /** Dentro la card della Home: nessuna barra propria (il contenitore è la card). */
  embedded?: boolean; testID?: string;
}) {
  const styles = useStyles();
  const { t } = useI18n();
  const [iconFamily] = useIconFamily();
  const lesson = isLesson(story);
  // Le icone originali restano identiche: cambia solo l'involucro (tre pill).
  // Prime due pill: solo icona. Terza pill: orologio + tempo di lettura.
  const clockIcon = iconFamily === "holo"
    ? <HoloClock size={GLYPH} testID={`${testID}-time-icon`} />
    : iconFamily === "gem"
      ? <View style={styles.clock} testID={`${testID}-time-icon`}><GemSymbol name="clock" /></View>
      : <Image source={CLOCK} style={styles.clock} contentFit="contain" transition={0} testID={`${testID}-time-icon`} />;
  return (
    <View style={[styles.bar, inline && styles.barInline, embedded && styles.barEmbedded]} testID={testID}>
      <View style={styles.pill} testID={`${testID}-kind`}>
        <View style={styles.iconWrap}>
          <KindIcon kind={lesson ? "lessons" : "stories"} size={GLYPH} glow={false} testID={`${testID}-kind-icon`} />
        </View>
      </View>
      <View style={styles.pill} testID={`${testID}-category`}>
        <View style={styles.iconWrap}>
          <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={CATEGORY} aspect={1.3} plain tight testID={`${testID}-category-icon`} />
        </View>
      </View>
      <View style={styles.pill} testID={`${testID}-time`}>
        <View style={styles.iconWrap}>{clockIcon}</View>
        <Text style={styles.value} numberOfLines={1} testID={`${testID}-time-value`}>{`${minutes} ${t.min}`}</Text>
      </View>
    </View>
  );
}

const PILL_H = 42;

const useStyles = makeStyles((colors) => ({
  // Barra contenitrice: tre colonne uguali, spaziatura costante, adattata alle
  // tre pill senza spazi inutili. Stesso linguaggio visivo del contenitore.
  bar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 6, paddingVertical: 6, borderRadius: 18, overflow: "hidden",
  },
  // Lettura/Home standalone: la barra ha il suo "vetro" (fondo scuro + bordo luminoso discreto).
  barInline: {
    alignSelf: "stretch",
    backgroundColor: withAlpha(colors.surfaceDeep, 0.5),
    borderWidth: 1, borderColor: withAlpha(colors.brand, 0.22),
    boxShadow: `0px 6px 22px ${withAlpha(colors.surfaceDeep, 0.5)}` as any,
  },
  // Dentro la card: il contenitore è la card, la barra resta trasparente.
  barEmbedded: {
    flex: 1, backgroundColor: "transparent", borderWidth: 0, boxShadow: "none" as any,
  },
  // Pill individuale: larghezza uniforme (flex 1), arrotondata, fondo scuro
  // traslucido e bordo luminoso discreto. Dimensioni fisse → layout stabile
  // qualunque sia la categoria o la lunghezza del tempo.
  pill: {
    flex: 1, height: PILL_H, borderRadius: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: withAlpha(colors.surfaceDeep, 0.62),
    borderWidth: 1, borderColor: withAlpha(colors.brand, 0.3),
    boxShadow: `inset 0px 0px 12px ${withAlpha(colors.brand, 0.1)}` as any,
  },
  // Area riservata all'icona identica in tutte e tre le pill.
  iconWrap: { width: 32, height: GLYPH, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  clock: { width: GLYPH, height: GLYPH },
  // Tempo di lettura: stessa riga dell'orologio, mai a capo.
  value: { color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 12, lineHeight: 16 },
}));
