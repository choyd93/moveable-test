<template>
    <div class="editor-container">
        <!-- 상단 버튼 패널 -->
        <div class="button-panel">
            <button @click="setActiveTool('text')">텍스트</button>
            <button @click="setActiveTool('memo')">메모</button>
            <button @click="setActiveTool('contents')">콘텐츠</button>
            <button @click="setActiveTool('link')">링크</button>
            <button @click="setActiveTool('dark')">깜깜이</button>
            <button @click="setActiveTool('line')">안내선</button>
        </div>

        <!-- 도화지와 도구 패널을 감싸는 영역 -->
        <div class="content-area">
            <!-- 컨테이너 영역 -->
            <div class="container-wrapper">
                <div class="container" @mousedown="startDrawing">
                    <!-- 동적으로 생성된 요소들 -->
                    <div
                        v-for="(element, index) in elements"
                        :key="index"
                        class="moveable-target"
                        :style="element.style"
                        :ref="el => (moveableTargets[index] = el)"
                        contenteditable="true"
                        @dblclick="toggleEditMode(index)"
                        @blur="toggleEditMode(index)"
                    >
                        {{ element.content }}
                    </div>
                    <!-- 임시 드래그 박스 -->
                    <div v-if="isDragging" class="drag-box" :style="dragBoxStyle"></div>
                </div>
            </div>

            <!-- 도구 패널 -->
            <div class="tool-panel">
                <div class="tool-section">
                    <h4>메모지 위치</h4>
                    <label>왼쪽 <input type="number" v-model="memoPosition.left" /></label>
                    <label>위쪽 <input type="number" v-model="memoPosition.top" /></label>
                </div>
                <div class="tool-section">
                    <h4>메모지 크기</h4>
                    <label>가로 <input type="number" v-model="memoSize.width" /></label>
                    <label>세로 <input type="number" v-model="memoSize.height" /></label>
                </div>
                <div class="tool-section">
                    <h4>내용</h4>
                    <textarea v-model="memoContent" rows="4"></textarea>
                    <label><input type="checkbox" v-model="applyToAll" /> 현재 메모지 설정을 전체에 적용</label>
                </div>
                <div class="tool-section">
                    <h4>폰트 설정</h4>
                    <select v-model="fontFamily">
                        <option value="나눔스퀘어">나눔스퀘어</option>
                        <option value="Arial">Arial</option>
                        <!-- 추가할 수 있는 폰트들 -->
                    </select>
                    <label>크기 <input type="number" v-model="fontSize" /></label>
                    <button>B</button>
                    <button>I</button>
                    <button>U</button>
                    <button>A</button>
                </div>
                <div class="tool-section">
                    <h4>배경 색상</h4>
                    <input type="color" v-model="backgroundColor" />
                </div>
            </div>
        </div>

        <!-- Moveable 컴포넌트 -->
        <Moveable
            v-for="(target, index) in moveableTargets"
            :key="index"
            :target="target"
            :renderDirections="renderDirections"
            :draggable="true"
            :resizable="true"
            :rotatable="true"
            :scalable="true"
            :throttleScale="0"
            :throttleResize="1"
            :keepRatio="false"
            @drag="onDrag"
            @resize="onResize"
            @rotate="onRotate"
            @scale="onScale"
        />
    </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import Moveable from 'vue3-moveable';

const renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const activeTool = ref(''); // 현재 선택된 도구 (텍스트, 메모 등)
const elements = reactive([]); // 컨테이너에 추가된 요소들
const moveableTargets = ref([]); // Moveable.js로 제어할 DOM 요소들
const isDragging = ref(false); // 드래그 상태
const dragBoxStyle = ref({}); // 드래그 박스 스타일

const memoPosition = reactive({ left: 0, top: 0 });
const memoSize = reactive({ width: 200, height: 150 });
const memoContent = ref('');
const applyToAll = ref(false);
const fontFamily = ref('나눔스퀘어');
const fontSize = ref(10);
const backgroundColor = ref('#ffffff');

// 도구 선택 함수
const setActiveTool = tool => {
    activeTool.value = tool;
};

// 텍스트 또는 메모 편집 모드 전환 함수
const toggleEditMode = index => {
    elements[index].isEditing = !elements[index].isEditing;
    if (elements[index].isEditing) {
        nextTick(() => {
            const target = moveableTargets.value[index];
            target.focus(); // 요소 포커스 설정

            // 커서를 텍스트의 맨 뒤로 이동
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(target);
            range.collapse(false); // 맨 뒤로 커서를 위치시킴

            selection.removeAllRanges();
            selection.addRange(range);
        });
    }
};

// 페이지에서 드래그하여 요소 생성
const startDrawing = event => {
    if (!activeTool.value) return;
    const startX = event.offsetX;
    const startY = event.offsetY;
    isDragging.value = false; // 드래그 상태 초기화

    const newElement = {
        type: activeTool.value,
        content: activeTool.value === 'text' ? '텍스트 입력' : '메모 입력',
        style: {
            position: 'absolute',
            left: `${startX}px`,
            top: `${startY}px`,
            width: '0px',
            height: '0px',
            backgroundColor: activeTool.value === 'memo' ? '#ffff99' : 'transparent', // 노란색 배경색상
            border: '1px solid #000',
            padding: '5px',
            cursor: 'move'
        }
    };

    const onMouseMove = moveEvent => {
        isDragging.value = true;
        const currentX = moveEvent.offsetX;
        const currentY = moveEvent.offsetY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // 드래그 박스 스타일 업데이트
        dragBoxStyle.value = {
            position: 'absolute',
            left: `${Math.min(currentX, startX)}px`,
            top: `${Math.min(currentY, startY)}px`,
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: 'rgba(0, 120, 255, 0.3)', // 파란색 반투명 배경
            border: '1px dashed #0078ff' // 파란색 점선 테두리
        };

        newElement.style.width = `${width}px`;
        newElement.style.height = `${height}px`;
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (isDragging.value) {
            // 요소가 성공적으로 드래그된 경우에만 Moveable 인스턴스 생성
            nextTick(() => {
                moveableTargets.value = moveableTargets.value.filter(el => el !== null);
                elements.push(newElement);
            });
        } else {
            // 드래그되지 않은 요소는 삭제
            elements.pop();
        }

        isDragging.value = false; // 드래그 종료
        activeTool.value = ''; // 도구 초기화
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
};

const onDrag = e => {
    e.target.style.transform = e.transform;
};

const onScale = e => {
    e.target.style.transform = e.drag.transform;
};

const onResize = e => {
    e.target.style.width = `${e.width}px`;
    e.target.style.height = `${e.height}px`;
    e.target.style.transform = e.drag.transform;
};

const onRotate = e => {
    e.target.style.transform = e.drag.transform;
};
</script>

<style scoped lang="scss">
.editor-container {
    display: flex;
    flex-direction: column; /* 상단에 버튼 패널 배치 */
    padding: 10px;
}

.button-panel {
    display: flex;
    gap: 5px;
    background-color: #f4f4f4;
    padding: 10px;
    border-radius: 8px;
    color: #fff;
    button {
        background-color: #fff;
    }
}

/* 도화지와 도구 패널을 감싸는 영역 */
.content-area {
    display: flex; /* 도화지와 도구 패널을 나란히 배치 */
    justify-content: center; /* 중앙 정렬 */
}

.container-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff; /* 도화지 배경색 설정 */
    padding: 30px;
    border-radius: 8px;
}

.container {
    width: 500px; /* 컨테이너 너비 */
    height: 500px; /* 컨테이너 높이 */
    border: 1px solid #ccc;
    position: relative;
    overflow: hidden;
}

.tool-panel {
    width: 300px; /* 도구 패널 너비 */
    background-color: #f4f4f4;
    padding: 20px;
    border-left: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tool-section {
    margin-bottom: 10px;

    h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #333;
    }

    label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
    }

    input,
    select,
    textarea {
        width: 100%;
        padding: 5px;
        margin: 5px 0;
        font-size: 14px;
    }
}

.moveable-target {
    position: absolute;
    border: 1px solid red;
    cursor: move;
}

.drag-box {
    pointer-events: none; /* 드래그 박스는 이벤트를 받지 않음 */
}
</style>
