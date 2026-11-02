import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'todue_tasks';
const COLORS = { low: '#2ecc71', medium: '#f1c40f', high: '#e74c3c' };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loaded, setLoaded] = useState(false);

  // Load saved tasks on start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setTasks(JSON.parse(data));
      setLoaded(true);
    });
  }, []);

  // Save whenever tasks change
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const addTask = () => {
    if (!title.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title, dueDate, priority, done: false }]);
    setTitle('');
    setDueDate('');
  };

  const toggleTask = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>To-due List</Text>

      <TextInput style={styles.input} placeholder="Task title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />

      <View style={styles.row}>
        {['low', 'medium', 'high'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, { backgroundColor: COLORS[p], opacity: priority === p ? 1 : 0.35 }]}
            onPress={() => setPriority(p)}
          >
            <Text style={styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={[styles.task, { borderLeftColor: COLORS[item.priority] }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTask(item.id)}>
              <Text style={[styles.taskTitle, item.done && styles.done]}>{item.title}</Text>
              <Text style={styles.small}>Due: {item.dueDate || 'no date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: StatusBar.currentHeight + 20 || 50, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, marginRight: 8 },
  chipText: { color: '#fff', fontWeight: '600' },
  addBtn: { marginLeft: 'auto', backgroundColor: '#3498db', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  addText: { color: '#fff', fontWeight: 'bold' },
  task: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, backgroundColor: '#f6f6f6', borderLeftWidth: 5, borderRadius: 6 },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  done: { textDecorationLine: 'line-through', color: 'gray' },
  small: { color: '#666', fontSize: 12 },
  delete: { color: '#e74c3c', fontWeight: '600' },
});