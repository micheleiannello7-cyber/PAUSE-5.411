// PAUSE — badge informativo della storia (proposta B): NESSUN contenitore
// esterno. Una linea orizzontale luminosa (CardFooterRule) sta sopra la griglia,
// tra il titolo e i dati. Riga unica con tre posizioni stabili, separate da una
// sottile linea verticale sfumata. Prime due: solo icona, senza testo. Terza:
// orologio + tempo di lettura dentro un piccolo badge arrotondato (glassmorphism).
// Le icone originali restano identiche. Usato in Home card, lettore e morph.
import { Fragment } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { StoryPreview, isLesson } from "@/src/api";
import { makeStyles, typography, useTheme, withAlpha } from "@/src/theme";
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
const CLOCK_GLYPH = 24; // orologio dentro il badge: un filo più piccolo, così il badge resta compatto
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
  const { colors } = useTheme();
  const { t } = useI18n();
  const [iconFamily] = useIconFamily();
  const lesson = isLesson(story);
  // Le icone originali restano identiche. Nessun contenitore esterno: solo tre
  // posizioni separate da una linea verticale sfumata. L'orologio e il tempo
  // vivono dentro un piccolo badge arrotondato (glassmorphism).
  const clockIcon = iconFamily === "holo"
    ? <HoloClock size={CLOCK_GLYPH} testID={`${testID}-time-icon`} />
    : iconFamily === "gem"
      ? <View style={styles.clock} testID={`${testID}-time-icon`}><GemSymbol name="clock" /></View>
      : <Image source={CLOCK} style={styles.clock} contentFit="contain" transition={0} testID={`${testID}-time-icon`} />;
  const cells = [
    <View style={styles.iconSlot} key="kind">
      <KindIcon kind={lesson ? "lessons" : "stories"} size={GLYPH} glow={false} testID={`${testID}-kind-icon`} />
    </View>,
    <View style={styles.iconSlot} key="category">
      <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={CATEGORY} aspect={1.3} plain tight testID={`${testID}-category-icon`} />
    </View>,
    <View style={styles.timeBadge} key="time">
      <View style={styles.clockWrap}>{clockIcon}</View>
      <Text style={styles.value} numberOfLines={1} testID={`${testID}-time-value`}>{`${minutes} ${t.min}`}</Text>
    </View>,
  ];
  const ids = ["kind", "category", "time"];
  return (
    <View style={[styles.bar, inline && styles.barInline, embedded && styles.barEmbedded]} testID={testID}>
      {cells.map((content, index) => (
        <Fragment key={ids[index]}>
          {index > 0 && (
            <LinearGradient
              pointerEvents="none"
              colors={[withAlpha(colors.brand, 0), withAlpha(colors.brand, 0.42), withAlpha(colors.brand, 0)]}
              style={styles.divider}
              testID={`${testID}-divider-${index}`}
            />
          )}
          <View style={styles.cell} testID={`${testID}-${ids[index]}`}>{content}</View>
        </Fragment>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  // Nessun contenitore: composizione libera e leggera. Riga unica, contenuto
  // centrato verticalmente. La linea orizzontale sopra è la CardFooterRule.
  bar: {
    flexDirection: "row", alignItems: "center", gap: 0,
    paddingHorizontal: 2, paddingVertical: 6,
  },
  barInline: { alignSelf: "stretch" },
  barEmbedded: { flex: 1 },
  // Scomparto: larghezza uniforme (flex 1), tre posizioni sempre stabili.
  cell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 0 },
  // Linea di separazione verticale, sfumata ai bordi: elegante, discreta.
  divider: { width: 1, height: 26 },
  // Area icona identica per le prime due icone.
  iconSlot: { width: 40, height: 30, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  // Badge compatto dell'orologio: sfondo scuro semitrasparente, bordo luminoso
  // discreto, leggero glassmorphism. Non deve dominare sulle altre due icone.
  timeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingLeft: 6, paddingRight: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: withAlpha(colors.surfaceDeep, 0.55),
    borderWidth: 1, borderColor: withAlpha(colors.brand, 0.32),
    boxShadow: `inset 0px 0px 10px ${withAlpha(colors.brand, 0.07)}` as any,
  },
  clockWrap: { width: CLOCK_GLYPH, height: CLOCK_GLYPH, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  clock: { width: CLOCK_GLYPH, height: CLOCK_GLYPH },
  // Tempo di lettura accanto all'orologio, mai a capo.
  value: { color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 12.5, lineHeight: 16, flexShrink: 1 },
}));
