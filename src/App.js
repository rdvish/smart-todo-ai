import './App.css';
import Header from './MyComponents/Header';
import Footer from './MyComponents/Footer';
import Todos from './MyComponents/Todos';
import {AddTodo} from './MyComponents/AddTodo';
import {About} from './MyComponents/About';
import { useState,useEffect} from 'react';
import {BrowserRouter as Router,Route,Routes,Link} from 'react-router-dom';
function App() {
  let initTodo;
  if(localStorage.getItem("todos")===null){
    initTodo = [];
  }
  else{
    initTodo = JSON.parse(localStorage.getItem("todos"));
  }
  const onDelete = (todo) => {
    /*console.log("I am onDelete of todo",todo);
    let index = todos.indexOf(todo);
    todos.splice(index,1);*/
    setTodos(todos.filter((e) => {
      return e!==todo;
    }));
    console.log("deleted",todo);
      localStorage.setItem("todos",JSON.stringify(todos));
  }
  const onComplete = (todo) => {
    const updatedTodos = todos.map((e) => {
    if (e === todo) {
      return { ...e, completed: true };
    }
    return e;
  });
  setTodos(updatedTodos);
  localStorage.setItem("todos", JSON.stringify(updatedTodos));
  
  }
  const addTodo = (title, desc) => {
    //console.log("I am adding this todo", title, desc);
    let sno;
    if(todos.length === 0){
       sno = 1;
    } else {
       sno = todos[todos.length-1].sno + 1;
    }
    const myTodo = {
      sno: sno,
      title: title,
      desc: desc,
    }
    setTodos([...todos, myTodo]);
    console.log(myTodo);
    //if(localStorage.getItem("todos")){
    
    //}
  }
  const [todos, setTodos] = useState(initTodo/*[
    {
      sno: 1,
      title: "Go to the market",
      desc: "You need to go to the market to buy groceries."
    },
    {
      sno: 2,
      title: "Complete React Project",
      desc: "Finish the React project by the end of this week."
    },
    {
      sno: 3,
      title: "Read a book",
      desc: "Read at least one chapter of a book every day."
    }
  ]*/);
  useEffect(()=>{
      localStorage.setItem("todos",JSON.stringify(todos));
    },[todos])
  return (
    <>
    <Router basename={process.env.PUBLIC_URL}>
      <div className="d-flex flex-column min-vh-100">
      <Header title="Smart Todo AI" searchBar={false}/>
      <div className="flex-grow-1">
      <Routes>
          <Route exact path="/" element={
            
              <>
              <AddTodo addTodo={addTodo}/>
              <Todos todos={todos} onComplete={onComplete} onDelete={onDelete}/>
              </>
            
          }> 
          </Route>
        <Route exact path="/about" element={<About />} />
    </Routes>
    </div>
      <Footer/>
      </div>
    </Router>
    </>
  );
}

export default App;
