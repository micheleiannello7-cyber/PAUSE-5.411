// PAUSE — badge informativo della storia (proposta B): NESSUN contenitore
// esterno. Una linea orizzontale luminosa (CardFooterRule) sta sopra la griglia,
// tra il titolo e i dati. Riga unica con tre posizioni stabili, separate da una
// sottile linea verticale sfumata. Prime due: solo icona, senza testo. Terza:
// orologio + tempo di lettura dentro un piccolo badge arrotondato (glassmorphism).
// Le icone originali restano identiche. Usato in Home card, lettore e morph.
import { Fragment, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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

  // Tap su un'icona (tipo o categoria): compare per un attimo il nome con una
  // piccola animazione (pop elastico + dissolvenza), poi sparisce da solo. Utile
  // a chi non riconosce l'icona senza etichetta.
  const [active, setActive] = useState<string | null>(null);
  const progress = useSharedValue(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reveal = (id: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Haptics.selectionAsync().catch(() => {});
    setActive(id);
    progress.value = 0;
    progress.value = withSpring(1, { damping: 14, stiffness: 240, mass: 0.6 });
    hideTimer.current = setTimeout(() => {
      progress.value = withTiming(0, { duration: 200 }, (fin) => { if (fin) runOnJS(setActive)(null); });
    }, 1600);
  };
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const categoryName = story.category_name.split("·")[0].trim();
  const items = [
    { id: "kind", label: lesson ? t.lesson_badge : t.curiosity_badge,
      node: <KindIcon kind={lesson ? "lessons" : "stories"} size={GLYPH} glow={false} testID={`${testID}-kind-icon`} /> },
    { id: "category", label: categoryName,
      node: <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={CATEGORY} aspect={1.3} plain tight testID={`${testID}-category-icon`} /> },
  ];

  const divider = (index: number) => (
    <LinearGradient pointerEvents="none"
      colors={[withAlpha(colors.brand, 0), withAlpha(colors.brand, 0.42), withAlpha(colors.brand, 0)]}
      style={styles.divider} testID={`${testID}-divider-${index}`} />
  );

  return (
    <View style={[styles.bar, inline && styles.barInline, embedded && styles.barEmbedded]} pointerEvents="box-none" testID={testID}>
      {items.map((it, index) => (
        <Fragment key={it.id}>
          {index > 0 && divider(index)}
          <Pressable style={styles.cell} onPress={() => reveal(it.id)} onLongPress={() => reveal(it.id)} hitSlop={6}
            accessibilityRole="button" accessibilityLabel={it.label} testID={`${testID}-${it.id}`}>
            <View style={styles.iconSlot}>{it.node}</View>
            {active === it.id && <IconTooltip text={it.label} progress={progress} styles={styles} testID={`${testID}-${it.id}-label`} />}
          </Pressable>
        </Fragment>
      ))}
      {divider(2)}
      <View style={styles.cell} testID={`${testID}-time`}>
        <View style={styles.timeBadge}>
          <View style={styles.clockWrap}>{clockIcon}</View>
          <Text style={styles.value} numberOfLines={1} testID={`${testID}-time-value`}>{`${minutes} ${t.min}`}</Text>
        </View>
      </View>
    </View>
  );
}

/** Etichetta transitoria sopra l'icona: pop elastico in scala + dissolvenza +
 *  piccola risalita, con un caret che punta all'icona. Breve e aggraziata. */
function IconTooltip({ text, progress, styles, testID }: { text: string; progress: SharedValue<number>; styles: any; testID?: string }) {
  const st = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 6 }, { scale: 0.72 + progress.value * 0.28 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.tooltip, st]} testID={testID}>
      <Text style={styles.tooltipText} numberOfLines={1}>{text}</Text>
      <View style={styles.tooltipCaret} />
    </Animated.View>
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
  // Etichetta transitoria sopra l'icona (nome categoria / tipo).
  tooltip: {
    position: "absolute", bottom: "100%", marginBottom: 7, alignSelf: "center",
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, maxWidth: 160,
    backgroundColor: withAlpha(colors.surfaceDeep, 0.95),
    borderWidth: 1, borderColor: withAlpha(colors.cyan, 0.55),
    boxShadow: `0px 6px 18px ${withAlpha(colors.surfaceDeep, 0.6)}, 0px 0px 12px ${withAlpha(colors.cyan, 0.2)}` as any,
  },
  tooltipText: { color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 12, lineHeight: 15, letterSpacing: 0.2, textAlign: "center" },
  // Piccolo "becco" sotto l'etichetta che punta verso l'icona.
  tooltipCaret: {
    position: "absolute", bottom: -4, alignSelf: "center",
    width: 8, height: 8, borderRadius: 2, transform: [{ rotate: "45deg" }],
    backgroundColor: withAlpha(colors.surfaceDeep, 0.95),
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: withAlpha(colors.cyan, 0.55),
  },
}));
