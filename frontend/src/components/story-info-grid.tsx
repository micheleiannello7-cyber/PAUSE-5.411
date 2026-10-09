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
// abbia la stessa altezza. `KindIcon` e l'orologio PNG hanno ~15% di margine
// trasparente dentro l'immagine; la categoria è ritagliata stretta (`tight`):
// serve una misura un filo diversa per pareggiare la dimensione visibile.
const GLYPH = 30;      // lampadina / libri · orologio (sia 3D che Olografico)
const CATEGORY = 29;   // categoria ritagliata — pareggiata alle altre due
// Orologio 3D generato nello stesso stile delle icone categoria e dei CTA.
const CLOCK = require("../../assets/images/kind-clock.png");

export function StoryInfoGrid({ story, minutes, inline = false, embedded = false, testID = "story-info-grid" }: {
  story: StoryPreview; minutes: number;
  /** Lettura/Home standalone: la barra è autoportante. */
  inline?: boolean;
  /** Dentro la card della Home: la barra si estende nello spazio della card. */
  embedded?: boolean; testID?: string;
}) {
  const styles = useStyles();
  const { t } = useI18n();
  const [iconFamily] = useIconFamily();
  const lesson = isLesson(story);
  // Le icone originali restano identiche: cambia solo l'involucro. Un unico
  // contenitore racchiude le tre pill. Prime due: solo icona. Terza: orologio
  // con il tempo di lettura SOTTO l'icona (come da mockup).
  const clockIcon = iconFamily === "holo"
    ? <HoloClock size={GLYPH} testID={`${testID}-time-icon`} />
    : iconFamily === "gem"
      ? <View style={styles.clock} testID={`${testID}-time-icon`}><GemSymbol name="clock" /></View>
      : <Image source={CLOCK} style={styles.clock} contentFit="contain" transition={0} testID={`${testID}-time-icon`} />;
  return (
    <View style={[styles.bar, inline && styles.barInline, embedded && styles.barEmbedded]} testID={testID}>
      <View style={styles.pill} testID={`${testID}-kind`}>
        <View style={styles.iconSlot}>
          <KindIcon kind={lesson ? "lessons" : "stories"} size={GLYPH} glow={false} testID={`${testID}-kind-icon`} />
        </View>
        <View style={styles.textSlot} />
      </View>
      <View style={styles.pill} testID={`${testID}-category`}>
        <View style={styles.iconSlot}>
          <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={CATEGORY} aspect={1.3} plain tight testID={`${testID}-category-icon`} />
        </View>
        <View style={styles.textSlot} />
      </View>
      <View style={styles.pill} testID={`${testID}-time`}>
        <View style={styles.iconSlot}>{clockIcon}</View>
        <View style={styles.textSlot}>
          <Text style={styles.value} numberOfLines={1} testID={`${testID}-time-value`}>{`${minutes} ${t.min}`}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  // Contenitore UNICO che racchiude le tre pill: fondo scuro traslucido e bordo
  // luminoso discreto, ben visibile. Tre colonne uguali, spaziatura costante,
  // adattato alle pill senza spazi inutili.
  bar: {
    flexDirection: "row", alignItems: "stretch", gap: 7,
    padding: 6, borderRadius: 18, overflow: "hidden",
    backgroundColor: withAlpha(colors.surfaceDeep, 0.55),
    borderWidth: 1, borderColor: withAlpha(colors.brand, 0.38),
    boxShadow: `inset 0px 0px 16px ${withAlpha(colors.brand, 0.1)}, 0px 6px 20px ${withAlpha(colors.surfaceDeep, 0.55)}` as any,
  },
  barInline: { alignSelf: "stretch" },
  barEmbedded: { flex: 1 },
  // Pill individuale: larghezza uniforme (flex 1), arrotondata, fondo scuro
  // traslucido e bordo luminoso. Icona in alto, tempo sotto (solo la terza).
  pill: {
    flex: 1, borderRadius: 13, paddingVertical: 5,
    alignItems: "center", justifyContent: "center",
    backgroundColor: withAlpha(colors.surfaceDeep, 0.72),
    borderWidth: 1, borderColor: withAlpha(colors.brand, 0.3),
  },
  // Area icona identica in tutte e tre le pill: icone allineate sulla stessa riga.
  iconSlot: { width: 40, height: 30, alignItems: "center", justifyContent: "center" },
  // Slot del testo sotto l'icona (vuoto nelle prime due): mantiene allineate le icone.
  textSlot: { height: 15, alignItems: "center", justifyContent: "center" },
  clock: { width: GLYPH, height: GLYPH },
  // Tempo di lettura sotto l'orologio, mai a capo.
  value: { color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 11.5, lineHeight: 15 },
}));
