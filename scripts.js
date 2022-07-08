//----------- Creación de Base de Datos Indexada ----------

const IDB = indexedDB;

const IDBRequest = IDB.open('taskslist', 1);

let db;

IDBRequest.addEventListener('error', e=>console.warn('Error: ', e.target.error));

IDBRequest.addEventListener('upgradeneeded', (e)=>{
	db=e.target.result;
	console.log('La base de datos ha sido creada');
	const objectStore = db.createObjectStore('tasks', {autoIncrement:true})
})

IDBRequest.addEventListener('success', (e)=>{
	console.log('La base de datos fué abierta');
	db=e.target.result;
	readData();
})



//-----------CRUD--------------

const addData = data=>{
	const IDBTransaction = db.transaction('tasks', 'readwrite');
	const objectStore = IDBTransaction.objectStore('tasks');
	objectStore.add(data);
	IDBTransaction.addEventListener('complete', ()=>console.log('Los datos han sido añadidos'))
}

const updateData = (data, key)=>{
	const IDBTransaction = db.transaction('tasks', 'readwrite');
	const objectStore = IDBTransaction.objectStore('tasks');
	objectStore.put(data, key);
	IDBTransaction.addEventListener('complete', ()=>console.log('Se ha actualizado la base de datos'))
}

const readData = ()=>{
	const IDBTransaction = db.transaction('tasks', 'readonly');
	const objectStore = IDBTransaction.objectStore('tasks');
	const request = objectStore.openCursor();
	let fragment=document.createDocumentFragment();
	result.innerHTML=''
	request.addEventListener('success', e=>{
		let cursor = e.target.result;
		if(cursor){
			console.log(cursor.value, cursor.key);
			let element = addElements(cursor.value.task, cursor.value.priority, cursor.key);
			fragment.appendChild(element);
			cursor.continue();
		}else console.log('Todos los datos han sido leídos');
		result.appendChild(fragment)
	})
}

const deleteData = key=>{
	const IDBTransaction = db.transaction('tasks', 'readwrite');
	const objectStore = IDBTransaction.objectStore('tasks');
	objectStore.delete(key)
	IDBTransaction.addEventListener('complete', ()=>console.log('los datos han sido eliminados de la base de datos'))
}


//----------- DOM ---------------

const inputTask = document.getElementById('input-task');
const inputPriority = document.getElementById('input-priority');
const addBtn = document.getElementById('add-btn');
const result = document.getElementById('result');
const trash = document.querySelector('.fa-trash');


addBtn.addEventListener('click', ()=>{
	if (inputTask.value.length>0){
		addData({task: inputTask.value, priority: inputPriority.value})
		inputTask.value='';
		readData();
	}else {
		inputTask.value='';
		inputTask.placeholder='Ingrese una tarea'
	}
})
addBtn.addEventListener('keyup', e=>{
	if (e.key=='Enter') {
		addBtn.click();
		inputTask.focus();
	}
})

inputPriority.addEventListener('change', ()=>{
	if (inputPriority.value.toLowerCase()=='baja'){
		inputPriority.className='low';
	} else if (inputPriority.value.toLowerCase()=='media'){
		inputPriority.className='normal';
	} else if (inputPriority.value.toLowerCase()=='alta'){
		inputPriority.className='high';
	}
})

inputTask.addEventListener('keyup', e=>{
	if (e.key=='Enter') {
		addBtn.click();
	}
})


const addElements = (task, priority, key) =>{
	let object = document.createElement('DIV');
	let taskElement = document.createElement('P');
	let priorityElement = document.createElement('P');
	let saveBtn = document.createElement('BUTTON');
	let deleteBtn = document.createElement('BUTTON');
	let undoBtn = document.createElement('I');
	let dragItem = document.createElement('DIV');

	object.classList.add('object');
	object.id = key;
	taskElement.classList.add('data');
	taskElement.setAttribute('contenteditable', true);
	taskElement.textContent=task;
	priorityElement.classList.add('priority');
	priorityElement.id='priority';
	priorityElement.textContent=priority.toUpperCase();
	saveBtn.classList.add('btn', 'savebtn', 'disabled');
	saveBtn.innerHTML='<span>Guardar</span><i class="fas fa-save"></i>';
	deleteBtn.classList.add('btn', 'deletebtn', 'enabled');
	deleteBtn.innerHTML='<span>Eliminar</span><i class="fas fa-trash-alt"></i>';
	undoBtn.classList.add('fas', 'fa-undo-alt', 'disabled');
	dragItem.className='drag-item';
	dragItem.innerHTML=`<div class="drag-item__decoration"></div>
						<i class="fas fa-arrows-alt"></i>`

	taskElement.addEventListener('input', ()=>{
		saveBtn.classList.replace('disabled', 'enabled');
		undoBtn.classList.replace('disabled', 'enabled');
	})

	deleteBtn.addEventListener('click', ()=>{
		deleteData(key);
		result.removeChild(object)
	})
	
	saveBtn.addEventListener('click', ()=>{
		if (saveBtn.className.includes('enabled')) {
			if (taskElement.textContent=='') taskElement.textContent=task;
			else updateData({task: taskElement.textContent, priority: priorityElement.	textContent.toLowerCase()},key);
			saveBtn.classList.replace('enabled', 'disabled');
			undoBtn.classList.replace('enabled', 'disabled')
		}
	})

	undoBtn.addEventListener('click', ()=>{
		if (undoBtn.className.includes('enabled')){
			taskElement.textContent=task;
			priorityElement.textContent=priority.toUpperCase();
			if (priorityElement.textContent=='BAJA'){
				priorityElement.className='priority low'
			}else if (priorityElement.textContent=='MEDIA'){
				priorityElement.className='priority normal'
			}else {
				priorityElement.className='priority high'
			}
			undoBtn.classList.replace('enabled', 'disabled');
			saveBtn.classList.replace('enabled', 'disabled');
		}
	})

	priorityElement.addEventListener('click', ()=>{
		saveBtn.classList.replace('disabled', 'enabled');
		undoBtn.classList.replace('disabled', 'enabled');
		if (priorityElement.textContent=='ALTA'){
			priorityElement.textContent='BAJA';
			priorityElement.classList.replace('high', 'low');
		}else if (priorityElement.textContent=='MEDIA'){
			priorityElement.textContent='ALTA';
			priorityElement.classList.replace('normal', 'high');
		}else {
			priorityElement.textContent='MEDIA';
			priorityElement.classList.replace('low', 'normal');
		}
	})

	dragItem.addEventListener('mousedown', (e)=>{
		object.setAttribute('draggable', true)
	})
	object.addEventListener('dragstart', (e)=>{
		e.dataTransfer.setData('text/plain', e.target.id);
	})
	object.addEventListener('dragend', ()=>{
		object.setAttribute('draggable', false)
	})


	if (priorityElement.textContent == 'BAJA') priorityElement.classList.add('low');
	else if (priorityElement.textContent == 'MEDIA') priorityElement.classList.add('normal');
	else if (priorityElement.textContent == 'ALTA') priorityElement.classList.add('high');
	object.append(taskElement, priorityElement, undoBtn, saveBtn, deleteBtn, dragItem);
	return object;
}


trash.addEventListener('dragover', (e)=>{
	e.preventDefault();
	e.target.classList.add('trashover');
})
trash.addEventListener('dragleave', e=>{
	e.target.classList.remove('trashover')
})
trash.addEventListener('drop', e=>{
	let data = e.dataTransfer.getData('text');
	console.log(data)
	if (data>0){	// para que no se dispare con cualquier cosa que arrastro
		console.log(data);
		result.removeChild(document.getElementById(data));
		deleteData(parseInt(data));
	}
	e.target.classList.remove('trashover');
})
