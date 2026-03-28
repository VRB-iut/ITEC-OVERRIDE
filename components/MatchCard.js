import { StyleSheet, Text, View } from "react-native";
import COLOR from "../var/COLOR";

export default function MatchCard({
  result,
  opponent,
  date,
  percentage,
  opponentColor,
}) {
  const isWinner = result === "VICTORIE";
  const formattedDate = new Date(date).toLocaleDateString("ro-RO");

  return (
    <View style={styles.cardContainer}>
      <View style={styles.infoSection}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text
          style={[
            styles.resultText,
            { color: isWinner ? "#4CAF50" : "#F44336" },
          ]}
        >
          {result} ({percentage}%)
        </Text>
      </View>

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <View
        style={[
          styles.opponentSection,
          {
            // Dacă isWinner este true -> Verde, altfel -> Roșu
            borderRightColor: isWinner ? "#4CAF50" : "#F44336",
          },
        ]}
      >
        <Text style={styles.opponentLabel}>ADVERSAR</Text>
        <Text style={styles.opponentName} numberOfLines={1}>
          {opponent}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLOR.borderColor,
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  infoSection: { flex: 2 },
  dateText: { color: "#666", fontSize: 10, fontWeight: "bold" },
  resultText: { fontWeight: "bold", fontSize: 14, marginTop: 2 },
  vsContainer: { flex: 0.5, alignItems: "center" },
  vsText: { color: "#444", fontWeight: "900", fontSize: 12 },
  opponentSection: {
    flex: 2,
    alignItems: "flex-end",
    borderRightWidth: 3,
    paddingRight: 10,
  },
  opponentLabel: { color: "#666", fontSize: 9, fontWeight: "bold" },
  opponentName: { color: "#fff", fontWeight: "bold", fontSize: 15 },
<<<<<<< HEAD
});
=======
});
>>>>>>> bf572aa6db8d3365f6a9a3bbae6267e51edd3286
